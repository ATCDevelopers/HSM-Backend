import {
  getDoctorSchedulesRepository,
  saveDoctorSchedulesRepository,
  getDoctorLeavesRepository,
  addDoctorLeaveRepository,
  findAppointmentsByDoctorAndDateRangeRepository,
  createAppointmentWithTransaction,
  rescheduleAppointmentRepository,
  cancelAppointmentRepository,
  updateAppointmentStatusRepository,
  findUpcomingAppointmentsRepository,
  getAppointmentReportsRepository,
  DoctorScheduleInput,
  DoctorLeaveInput,
  CreateAppointmentInput,
  RescheduleAppointmentInput,
  AppointmentReportFilters,
} from '../repositories/appointment.repository.js';

export interface ComputedSlot {
  date: string;
  time: string;
  status: 'available' | 'booked' | 'blocked';
}

export const getDoctorAvailabilityService = async (
  doctorId: string,
  startDateStr: string,
  endDateStr: string
): Promise<{ doctorId: string; startDate: string; endDate: string; slots: ComputedSlot[] }> => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('INVALID_DATE: Invalid start or end date format.');
  }

  if (start > end) {
    throw new Error('INVALID_DATE_RANGE: startDate cannot be after endDate.');
  }

  // Retrieve schedule settings, leave periods, and existing appointments
  const [schedules, leaves, existingAppointments] = await Promise.all([
    getDoctorSchedulesRepository(doctorId),
    getDoctorLeavesRepository(doctorId, start, end),
    findAppointmentsByDoctorAndDateRangeRepository(doctorId, start, end),
  ]);

  const scheduleMap = new Map<number, typeof schedules[0]>();
  schedules.forEach((s) => scheduleMap.set(s.dayOfWeek, s));

  // Map existing booked appointments by "YYYY-MM-DD_HH:mm"
  const bookedSet = new Set<string>();
  existingAppointments.forEach((app) => {
    const dateStr = app.appointmentDate.toISOString().split('T')[0];
    bookedSet.add(`${dateStr}_${app.appointmentTime}`);
  });

  const slots: ComputedSlot[] = [];
  const current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const dayOfWeek = current.getDay(); // 0 = Sun, 1 = Mon ...
    const daySchedule = scheduleMap.get(dayOfWeek);

    // Check if the current date falls within any doctor leave
    const isLeave = leaves.some((leave) => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      const currentDateOnly = new Date(dateStr);
      const leaveStartOnly = new Date(leaveStart.toISOString().split('T')[0]);
      const leaveEndOnly = new Date(leaveEnd.toISOString().split('T')[0]);
      return currentDateOnly >= leaveStartOnly && currentDateOnly <= leaveEndOnly;
    });

    if (isLeave || !daySchedule || !daySchedule.isWorkingDay) {
      // Entire day is blocked / off
      slots.push({
        date: dateStr,
        time: 'ALL_DAY',
        status: 'blocked',
      });
    } else {
      // Compute time slots based on working hours and slot duration
      const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
      const [endHour, endMin] = daySchedule.endTime.split(':').map(Number);
      const slotDuration = daySchedule.slotDurationMinutes || 30;

      let slotStartMinutes = startHour * 60 + startMin;
      const slotEndMinutes = endHour * 60 + endMin;

      while (slotStartMinutes + slotDuration <= slotEndMinutes) {
        const hh = String(Math.floor(slotStartMinutes / 60)).padStart(2, '0');
        const mm = String(slotStartMinutes % 60).padStart(2, '0');
        const timeStr = `${hh}:${mm}`;

        const isBooked = bookedSet.has(`${dateStr}_${timeStr}`);

        slots.push({
          date: dateStr,
          time: timeStr,
          status: isBooked ? 'booked' : 'available',
        });

        slotStartMinutes += slotDuration;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return {
    doctorId,
    startDate: startDateStr,
    endDate: endDateStr,
    slots,
  };
};

export const setDoctorSchedulesService = async (
  doctorId: string,
  schedules: DoctorScheduleInput[],
  leaves?: DoctorLeaveInput[],
  userId?: string
) => {
  const savedSchedules = await saveDoctorSchedulesRepository(doctorId, schedules, userId);

  let savedLeaves: any[] = [];
  if (leaves && leaves.length > 0) {
    savedLeaves = await Promise.all(
      leaves.map((leave) =>
        addDoctorLeaveRepository(
          doctorId,
          {
            startDate: new Date(leave.startDate),
            endDate: new Date(leave.endDate),
            reason: leave.reason,
          },
          userId
        )
      )
    );
  }

  return {
    schedules: savedSchedules,
    leaves: savedLeaves,
  };
};

export const bookAppointmentService = async (input: CreateAppointmentInput, userId?: string) => {
  const appointmentDate = new Date(input.appointmentDate);
  if (isNaN(appointmentDate.getTime())) {
    throw new Error('INVALID_DATE: Invalid appointmentDate.');
  }

  return await createAppointmentWithTransaction(
    {
      ...input,
      appointmentDate,
    },
    userId
  );
};

export const rescheduleAppointmentService = async (
  appointmentId: string,
  input: RescheduleAppointmentInput,
  userId?: string
) => {
  const appointmentDate = new Date(input.appointmentDate);
  if (isNaN(appointmentDate.getTime())) {
    throw new Error('INVALID_DATE: Invalid appointmentDate.');
  }

  return await rescheduleAppointmentRepository(
    appointmentId,
    {
      ...input,
      appointmentDate,
    },
    userId
  );
};

export const cancelAppointmentService = async (
  appointmentId: string,
  reason: string,
  userId?: string
) => {
  if (!reason || reason.trim() === '') {
    throw new Error('REASON_REQUIRED: A valid reason is required for appointment cancellation.');
  }

  return await cancelAppointmentRepository(appointmentId, reason.trim(), userId);
};

export const updateAppointmentStatusService = async (
  appointmentId: string,
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show',
  userId?: string
) => {
  const validStatuses = ['scheduled', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'];
  if (!validStatuses.includes(status)) {
    throw new Error(`INVALID_STATUS: Allowed statuses are ${validStatuses.join(', ')}`);
  }

  return await updateAppointmentStatusRepository(appointmentId, status, userId);
};

export const sendAppointmentRemindersService = async () => {
  const upcoming = await findUpcomingAppointmentsRepository(24);

  const queuedReminders = upcoming.map((item) => ({
    appointmentId: item.appointment.id,
    patientId: item.patient?.id || item.appointment.patientId,
    patientName: item.patient ? `${item.patient.firstName} ${item.patient.lastName}`.trim() : 'Valued Patient',
    patientEmail: item.patient?.email || '',
    patientPhone: item.patient?.phoneNumber || '',
    doctorName: item.doctor ? `${item.doctor.firstName} ${item.doctor.lastName}`.trim() : 'Assigned Doctor',
    appointmentDate: item.appointment.appointmentDate,
    appointmentTime: item.appointment.appointmentTime,
    status: 'QUEUED_FOR_NOTIFICATION',
  }));

  return {
    processedCount: queuedReminders.length,
    reminders: queuedReminders,
  };
};

export const getAppointmentReportsService = async (filters: AppointmentReportFilters) => {
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    filters.endDate = end;
  }
  return await getAppointmentReportsRepository(filters);
};
