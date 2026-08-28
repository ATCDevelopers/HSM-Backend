import { db } from '../config/db.js';
import { AppointmentTable, DoctorScheduleTable, DoctorLeaveTable, AppointmentAuditLogTable, userAppointment, PatientTable, UserTable } from '../drizzle/schema.js';
import { eq, and, gte, lte, ne, isNull, sql } from 'drizzle-orm';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show';

/**
 * Allowed forward moves through the appointment lifecycle (AM-011).
 * `completed`, `cancelled` and `no_show` are terminal: nothing may leave them.
 */
export const APPOINTMENT_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['confirmed', 'checked_in', 'cancelled', 'no_show'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
};

/**
 * Stable lock identity for one doctor's slot. Used with a transaction-scoped
 * advisory lock so two concurrent bookings cannot both pass the conflict check.
 */
const slotLockKey = (doctorId: string, date: Date, time: string): string =>
  `appointment-slot:${doctorId}:${date.toISOString().slice(0, 10)}:${time}`;

const lockDoctorSlot = async (tx: any, doctorId: string, date: Date, time: string): Promise<void> => {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${slotLockKey(doctorId, date, time)}, 0))`);
};

export interface DoctorScheduleInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes?: number;
  isWorkingDay?: boolean;
}

export interface DoctorLeaveInput {
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId?: string;
  appointmentType: string;
  priority?: 'low' | 'medium' | 'high' | 'emergency';
  reason: string;
  appointmentDate: Date;
  appointmentTime: string;
}

export interface RescheduleAppointmentInput {
  appointmentDate: Date;
  appointmentTime: string;
  doctorId?: string;
}

export interface AppointmentReportFilters {
  doctorId?: string;
  patientId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: AppointmentStatus;
}

export const getDoctorSchedulesRepository = async (doctorId: string) => {
  return await db
    .select()
    .from(DoctorScheduleTable)
    .where(and(eq(DoctorScheduleTable.doctorId, doctorId), isNull(DoctorScheduleTable.deletedAt)));
};

export const saveDoctorSchedulesRepository = async (
  doctorId: string,
  schedules: DoctorScheduleInput[],
  updatedBy?: string
) => {
  return await db.transaction(async (tx) => {
    // Soft-delete existing schedules for doctor
    await tx
      .update(DoctorScheduleTable)
      .set({ deletedAt: new Date(), deletedBy: updatedBy || null, updatedBy: updatedBy || null })
      .where(and(eq(DoctorScheduleTable.doctorId, doctorId), isNull(DoctorScheduleTable.deletedAt)));

    if (schedules.length === 0) {
      return [];
    }

    const newSchedules = schedules.map((s) => ({
      doctorId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDurationMinutes: s.slotDurationMinutes ?? 30,
      isWorkingDay: s.isWorkingDay ?? true,
      createdBy: updatedBy || null,
    }));

    return await tx.insert(DoctorScheduleTable).values(newSchedules).returning();
  });
};

export const getDoctorLeavesRepository = async (doctorId: string, startDate?: Date, endDate?: Date) => {
  const conditions = [eq(DoctorLeaveTable.doctorId, doctorId), isNull(DoctorLeaveTable.deletedAt)];

  if (startDate) {
    conditions.push(gte(DoctorLeaveTable.endDate, startDate));
  }
  if (endDate) {
    conditions.push(lte(DoctorLeaveTable.startDate, endDate));
  }

  return await db
    .select()
    .from(DoctorLeaveTable)
    .where(and(...conditions));
};

export const addDoctorLeaveRepository = async (
  doctorId: string,
  leaveInput: DoctorLeaveInput,
  createdBy?: string
) => {
  return await db.transaction(async (tx) => {
    const [leave] = await tx
      .insert(DoctorLeaveTable)
      .values({
        doctorId,
        startDate: leaveInput.startDate,
        endDate: leaveInput.endDate,
        reason: leaveInput.reason || null,
        createdBy: createdBy || null,
      })
      .returning();

    return leave;
  });
};

export const findAppointmentsByDoctorAndDateRangeRepository = async (
  doctorId: string,
  startDate: Date,
  endDate: Date
) => {
  return await db
    .select()
    .from(AppointmentTable)
    .where(
      and(
        eq(AppointmentTable.doctorId, doctorId),
        gte(AppointmentTable.appointmentDate, startDate),
        lte(AppointmentTable.appointmentDate, endDate),
        ne(AppointmentTable.status, 'cancelled'),
        isNull(AppointmentTable.deletedAt)
      )
    );
};

export const findAppointmentByIdRepository = async (id: string) => {
  const appointments = await db
    .select()
    .from(AppointmentTable)
    .where(and(eq(AppointmentTable.id, id), isNull(AppointmentTable.deletedAt)));

  return appointments.length > 0 ? appointments[0] : null;
};

export const createAppointmentWithTransaction = async (
  input: CreateAppointmentInput,
  createdBy?: string
) => {
  return await db.transaction(async (tx) => {
    const { patientId, doctorId, appointmentType, priority, reason, appointmentDate, appointmentTime } = input;

    // AM-006: Prevent concurrent double-booking for the doctor at exact date and time.
    // The advisory lock serialises rival transactions on this slot; without it two
    // concurrent bookings both read an empty conflict set and both insert.
    if (doctorId) {
      await lockDoctorSlot(tx, doctorId, appointmentDate, appointmentTime);

      const existing = await tx
        .select()
        .from(AppointmentTable)
        .where(
          and(
            eq(AppointmentTable.doctorId, doctorId),
            eq(AppointmentTable.appointmentDate, appointmentDate),
            eq(AppointmentTable.appointmentTime, appointmentTime),
            ne(AppointmentTable.status, 'cancelled'),
            isNull(AppointmentTable.deletedAt)
          )
        );

      if (existing.length > 0) {
        throw new Error('SLOT_BOOKED: The selected doctor already has an appointment booked for this time slot.');
      }
    }

    // Insert new appointment
    const [appointment] = await tx
      .insert(AppointmentTable)
      .values({
        patientId,
        doctorId: doctorId || null,
        appointmentType,
        priority: priority || 'medium',
        status: 'scheduled',
        reason,
        appointmentDate,
        appointmentTime,
        createdBy: createdBy || null,
      })
      .returning();

    // Link doctor to appointment in user_appointment pivot table if doctorId is present
    if (doctorId) {
      await tx
        .insert(userAppointment)
        .values({
          userId: doctorId,
          appointmentId: appointment.id,
        })
        .onConflictDoNothing();
    }

    // Insert audit record
    await tx.insert(AppointmentAuditLogTable).values({
      appointmentId: appointment.id,
      action: 'BOOKED',
      previousState: null,
      newState: 'scheduled',
      reason: reason,
      performedBy: createdBy || null,
    });

    return appointment;
  });
};

export const rescheduleAppointmentRepository = async (
  id: string,
  input: RescheduleAppointmentInput,
  updatedBy?: string
) => {
  return await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(AppointmentTable)
      .where(and(eq(AppointmentTable.id, id), isNull(AppointmentTable.deletedAt)));

    if (existing.length === 0) {
      throw new Error('NOT_FOUND: Appointment not found');
    }

    const currentAppointment = existing[0];
    if (currentAppointment.status === 'cancelled' || currentAppointment.status === 'completed') {
      throw new Error(`INVALID_STATE: Cannot reschedule an appointment with status '${currentAppointment.status}'`);
    }

    const targetDoctorId = input.doctorId || currentAppointment.doctorId;

    // Check collision for target doctor and new date/time
    if (targetDoctorId) {
      await lockDoctorSlot(tx, targetDoctorId, input.appointmentDate, input.appointmentTime);

      const conflicts = await tx
        .select()
        .from(AppointmentTable)
        .where(
          and(
            eq(AppointmentTable.doctorId, targetDoctorId),
            eq(AppointmentTable.appointmentDate, input.appointmentDate),
            eq(AppointmentTable.appointmentTime, input.appointmentTime),
            ne(AppointmentTable.id, id),
            ne(AppointmentTable.status, 'cancelled'),
            isNull(AppointmentTable.deletedAt)
          )
        );

      if (conflicts.length > 0) {
        throw new Error('SLOT_BOOKED: Target time slot is already booked for this doctor.');
      }
    }

    const [updatedAppointment] = await tx
      .update(AppointmentTable)
      .set({
        appointmentDate: input.appointmentDate,
        appointmentTime: input.appointmentTime,
        doctorId: targetDoctorId || null,
        updatedAt: new Date(),
        updatedBy: updatedBy || null,
      })
      .where(eq(AppointmentTable.id, id))
      .returning();

    // Update doctor link in pivot table if doctor changed
    if (targetDoctorId && targetDoctorId !== currentAppointment.doctorId) {
      if (currentAppointment.doctorId) {
        await tx
          .delete(userAppointment)
          .where(
            and(
              eq(userAppointment.userId, currentAppointment.doctorId),
              eq(userAppointment.appointmentId, id)
            )
          );
      }
      await tx
        .insert(userAppointment)
        .values({
          userId: targetDoctorId,
          appointmentId: id,
        })
        .onConflictDoNothing();
    }

    // Insert audit log entry
    await tx.insert(AppointmentAuditLogTable).values({
      appointmentId: id,
      action: 'RESCHEDULED',
      previousState: `${currentAppointment.appointmentDate.toISOString().split('T')[0]} ${currentAppointment.appointmentTime}`,
      newState: `${input.appointmentDate.toISOString().split('T')[0]} ${input.appointmentTime}`,
      reason: 'Appointment rescheduled by user',
      performedBy: updatedBy || null,
    });

    return updatedAppointment;
  });
};

export const cancelAppointmentRepository = async (
  id: string,
  reason: string,
  cancelledBy?: string
) => {
  return await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(AppointmentTable)
      .where(and(eq(AppointmentTable.id, id), isNull(AppointmentTable.deletedAt)));

    if (existing.length === 0) {
      throw new Error('NOT_FOUND: Appointment not found');
    }

    const currentAppointment = existing[0];
    if (currentAppointment.status === 'cancelled') {
      throw new Error('ALREADY_CANCELLED: Appointment is already cancelled');
    }

    const [cancelledAppointment] = await tx
      .update(AppointmentTable)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
        updatedBy: cancelledBy || null,
      })
      .where(eq(AppointmentTable.id, id))
      .returning();

    // Insert cancellation audit entry with reason mandatory (SRS AM-003)
    await tx.insert(AppointmentAuditLogTable).values({
      appointmentId: id,
      action: 'CANCELLED',
      previousState: currentAppointment.status,
      newState: 'cancelled',
      reason,
      performedBy: cancelledBy || null,
    });

    return cancelledAppointment;
  });
};

export const updateAppointmentStatusRepository = async (
  id: string,
  newStatus: AppointmentStatus,
  updatedBy?: string,
  reason?: string
) => {
  return await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(AppointmentTable)
      .where(and(eq(AppointmentTable.id, id), isNull(AppointmentTable.deletedAt)));

    if (existing.length === 0) {
      throw new Error('NOT_FOUND: Appointment not found');
    }

    const currentAppointment = existing[0];
    const currentStatus = currentAppointment.status as AppointmentStatus;

    // AM-011: reject moves the lifecycle does not allow (e.g. completed -> scheduled).
    // Enforced inside the transaction so a concurrent update cannot slip past it.
    if (currentStatus === newStatus) {
      throw new Error(`INVALID_TRANSITION: Appointment is already '${currentStatus}'`);
    }

    if (!APPOINTMENT_STATUS_TRANSITIONS[currentStatus].includes(newStatus)) {
      const allowed = APPOINTMENT_STATUS_TRANSITIONS[currentStatus];
      throw new Error(
        `INVALID_TRANSITION: Cannot move from '${currentStatus}' to '${newStatus}'. ` +
          (allowed.length > 0 ? `Allowed next states: ${allowed.join(', ')}` : `'${currentStatus}' is a terminal state`)
      );
    }

    const [updatedAppointment] = await tx
      .update(AppointmentTable)
      .set({
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: updatedBy || null,
      })
      .where(eq(AppointmentTable.id, id))
      .returning();

    // Insert audit record. Cancellations keep the CANCELLED action and their mandated
    // reason (AM-003) even when they arrive through the status endpoint.
    await tx.insert(AppointmentAuditLogTable).values({
      appointmentId: id,
      action: newStatus === 'cancelled' ? 'CANCELLED' : 'STATUS_UPDATED',
      previousState: currentStatus,
      newState: newStatus,
      reason: reason || null,
      performedBy: updatedBy || null,
    });

    return updatedAppointment;
  });
};

export const findUpcomingAppointmentsRepository = async (withinHours: number = 24) => {
  const now = new Date();
  const future = new Date(now.getTime() + withinHours * 60 * 60 * 1000);

  // AM-005: the reminder window must compare against the real appointment instant.
  // appointment_date only carries the day, so the HH:mm text column is folded back in;
  // the CASE guards the interval cast so a malformed legacy time cannot abort the query.
  // `AT TIME ZONE 'UTC'` reads the naive timestamp as UTC — the same basis the service
  // stores it on — so the comparison does not drift with the session time zone.
  const appointmentInstant = sql`((
    date_trunc('day', ${AppointmentTable.appointmentDate})
    + CASE
        WHEN ${AppointmentTable.appointmentTime} ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$'
          THEN ${AppointmentTable.appointmentTime}::interval
        ELSE INTERVAL '0'
      END
  ) AT TIME ZONE 'UTC')`;

  return await db
    .select({
      appointment: AppointmentTable,
      patient: PatientTable,
      doctor: UserTable,
    })
    .from(AppointmentTable)
    .leftJoin(PatientTable, eq(AppointmentTable.patientId, PatientTable.id))
    .leftJoin(UserTable, eq(AppointmentTable.doctorId, UserTable.id))
    .where(
      and(
        sql`${appointmentInstant} >= ${now}`,
        sql`${appointmentInstant} <= ${future}`,
        ne(AppointmentTable.status, 'cancelled'),
        ne(AppointmentTable.status, 'completed'),
        ne(AppointmentTable.status, 'no_show'),
        isNull(AppointmentTable.deletedAt)
      )
    );
};

export const getAppointmentReportsRepository = async (filters: AppointmentReportFilters) => {
  const conditions = [isNull(AppointmentTable.deletedAt)];

  if (filters.doctorId) {
    conditions.push(eq(AppointmentTable.doctorId, filters.doctorId));
  }
  if (filters.patientId) {
    conditions.push(eq(AppointmentTable.patientId, filters.patientId));
  }
  if (filters.startDate) {
    conditions.push(gte(AppointmentTable.appointmentDate, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(AppointmentTable.appointmentDate, filters.endDate));
  }
  if (filters.status) {
    conditions.push(eq(AppointmentTable.status, filters.status));
  }

  const results = await db
    .select({
      id: AppointmentTable.id,
      patientId: AppointmentTable.patientId,
      patientFirstName: PatientTable.firstName,
      patientLastName: PatientTable.lastName,
      patientEmail: PatientTable.email,
      doctorId: AppointmentTable.doctorId,
      doctorFirstName: UserTable.firstName,
      doctorLastName: UserTable.lastName,
      appointmentType: AppointmentTable.appointmentType,
      priority: AppointmentTable.priority,
      status: AppointmentTable.status,
      reason: AppointmentTable.reason,
      appointmentDate: AppointmentTable.appointmentDate,
      appointmentTime: AppointmentTable.appointmentTime,
      createdAt: AppointmentTable.createdAt,
    })
    .from(AppointmentTable)
    .leftJoin(PatientTable, eq(AppointmentTable.patientId, PatientTable.id))
    .leftJoin(UserTable, eq(AppointmentTable.doctorId, UserTable.id))
    .where(and(...conditions));

  return results;
};
