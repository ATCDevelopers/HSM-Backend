import { db } from '../config/db.js';
import { AppointmentTable, DoctorScheduleTable, DoctorLeaveTable, AppointmentAuditLogTable, userAppointment, PatientTable, UserTable } from '../drizzle/schema.js';
import { eq, and, gte, lte, ne, sql } from 'drizzle-orm';

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
  status?: 'scheduled' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
}

export const getDoctorSchedulesRepository = async (doctorId: string) => {
  return await db
    .select()
    .from(DoctorScheduleTable)
    .where(and(eq(DoctorScheduleTable.doctorId, doctorId), sql`${DoctorScheduleTable.deletedAt} IS NULL`));
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
      .set({ deletedAt: new Date(), updatedBy: updatedBy || null })
      .where(and(eq(DoctorScheduleTable.doctorId, doctorId), sql`${DoctorScheduleTable.deletedAt} IS NULL`));

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
  const conditions = [eq(DoctorLeaveTable.doctorId, doctorId), sql`${DoctorLeaveTable.deletedAt} IS NULL`];

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
        sql`${AppointmentTable.deletedAt} IS NULL`
      )
    );
};

export const findAppointmentByIdRepository = async (id: string) => {
  const appointments = await db
    .select()
    .from(AppointmentTable)
    .where(and(eq(AppointmentTable.id, id), sql`${AppointmentTable.deletedAt} IS NULL`));

  return appointments.length > 0 ? appointments[0] : null;
};

export const createAppointmentWithTransaction = async (
  input: CreateAppointmentInput,
  createdBy?: string
) => {
  return await db.transaction(async (tx) => {
    const { patientId, doctorId, appointmentType, priority, reason, appointmentDate, appointmentTime } = input;

    // AM-006: Prevent concurrent double-booking for the doctor at exact date and time
    if (doctorId) {
      const existing = await tx
        .select()
        .from(AppointmentTable)
        .where(
          and(
            eq(AppointmentTable.doctorId, doctorId),
            eq(AppointmentTable.appointmentDate, appointmentDate),
            eq(AppointmentTable.appointmentTime, appointmentTime),
            ne(AppointmentTable.status, 'cancelled'),
            sql`${AppointmentTable.deletedAt} IS NULL`
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
      .where(and(eq(AppointmentTable.id, id), sql`${AppointmentTable.deletedAt} IS NULL`));

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
            sql`${AppointmentTable.deletedAt} IS NULL`
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
      .where(and(eq(AppointmentTable.id, id), sql`${AppointmentTable.deletedAt} IS NULL`));

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
  newStatus: 'scheduled' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show',
  updatedBy?: string
) => {
  return await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(AppointmentTable)
      .where(and(eq(AppointmentTable.id, id), sql`${AppointmentTable.deletedAt} IS NULL`));

    if (existing.length === 0) {
      throw new Error('NOT_FOUND: Appointment not found');
    }

    const currentAppointment = existing[0];

    const [updatedAppointment] = await tx
      .update(AppointmentTable)
      .set({
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: updatedBy || null,
      })
      .where(eq(AppointmentTable.id, id))
      .returning();

    // Insert audit record
    await tx.insert(AppointmentAuditLogTable).values({
      appointmentId: id,
      action: 'STATUS_UPDATED',
      previousState: currentAppointment.status,
      newState: newStatus,
      performedBy: updatedBy || null,
    });

    return updatedAppointment;
  });
};

export const findUpcomingAppointmentsRepository = async (withinHours: number = 24) => {
  const now = new Date();
  const future = new Date(now.getTime() + withinHours * 60 * 60 * 1000);

  return await db
    .select({
      appointment: AppointmentTable,
      patient: PatientTable,
      doctor: UserTable,
    })
    .from(AppointmentTable)
    .innerJoin(PatientTable, eq(AppointmentTable.patientId, PatientTable.id))
    .leftJoin(UserTable, eq(AppointmentTable.doctorId, UserTable.id))
    .where(
      and(
        gte(AppointmentTable.appointmentDate, now),
        lte(AppointmentTable.appointmentDate, future),
        ne(AppointmentTable.status, 'cancelled'),
        ne(AppointmentTable.status, 'completed'),
        sql`${AppointmentTable.deletedAt} IS NULL`
      )
    );
};

export const getAppointmentReportsRepository = async (filters: AppointmentReportFilters) => {
  const conditions = [sql`${AppointmentTable.deletedAt} IS NULL`];

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
    .innerJoin(PatientTable, eq(AppointmentTable.patientId, PatientTable.id))
    .leftJoin(UserTable, eq(AppointmentTable.doctorId, UserTable.id))
    .where(and(...conditions));

  return results;
};
