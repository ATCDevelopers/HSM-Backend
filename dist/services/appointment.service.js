import { getDoctorSchedulesRepository, saveDoctorSchedulesRepository, getDoctorLeavesRepository, addDoctorLeaveRepository, findAppointmentsByDoctorAndDateRangeRepository, createAppointmentWithTransaction, rescheduleAppointmentRepository, cancelAppointmentRepository, updateAppointmentStatusRepository, findUpcomingAppointmentsRepository, getAppointmentReportsRepository, } from '../repositories/appointment.repository.js';
/**
 * All slot maths runs in UTC. Mixing a UTC date string with a local weekday
 * shifts every slot by a day for any server not running at UTC+0.
 */
const toUtcDateOnly = (value) => {
    const parsed = value instanceof Date ? value : new Date(value);
    if (isNaN(parsed.getTime())) {
        return parsed;
    }
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
};
const toDateKey = (date) => date.toISOString().slice(0, 10);
const parseTimeToMinutes = (time) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(time ?? '').trim());
    if (!match) {
        throw new Error(`INVALID_SLOT: Invalid time '${time}'. Expected HH:mm in 24-hour form.`);
    }
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) {
        throw new Error(`INVALID_SLOT: Invalid time '${time}'. Expected HH:mm in 24-hour form.`);
    }
    return hours * 60 + minutes;
};
/** Pads to HH:mm so "9:00" and "09:00" cannot occupy the same slot as two distinct rows. */
const normalizeTime = (time) => {
    const total = parseTimeToMinutes(time);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
/**
 * Rejects a slot the availability endpoint would report as `blocked`: a leave day,
 * a non-working weekday, a time outside working hours, or a time that does not sit
 * on the doctor's slot grid. Booking and rescheduling both go through this so the
 * two endpoints can no longer disagree.
 */
const assertSlotIsOpen = async (doctorId, appointmentDate, appointmentTime) => {
    const dayStart = toUtcDateOnly(appointmentDate);
    const [schedules, leaves] = await Promise.all([
        getDoctorSchedulesRepository(doctorId),
        getDoctorLeavesRepository(doctorId, dayStart, dayStart),
    ]);
    if (leaves.length > 0) {
        throw new Error(`DOCTOR_ON_LEAVE: The doctor is on approved leave on ${toDateKey(dayStart)}.`);
    }
    const daySchedule = schedules.find((s) => s.dayOfWeek === dayStart.getUTCDay());
    if (!daySchedule || !daySchedule.isWorkingDay) {
        throw new Error(`OUTSIDE_SCHEDULE: The doctor has no working hours configured for ${toDateKey(dayStart)}.`);
    }
    const slotDuration = daySchedule.slotDurationMinutes || 30;
    const requested = parseTimeToMinutes(appointmentTime);
    const openFrom = parseTimeToMinutes(daySchedule.startTime);
    const openUntil = parseTimeToMinutes(daySchedule.endTime);
    if (requested < openFrom || requested + slotDuration > openUntil) {
        throw new Error(`INVALID_SLOT: ${appointmentTime} is outside the doctor's working hours ` +
            `(${daySchedule.startTime}-${daySchedule.endTime}).`);
    }
    if ((requested - openFrom) % slotDuration !== 0) {
        throw new Error(`INVALID_SLOT: ${appointmentTime} is not a slot start. Slots begin every ` +
            `${slotDuration} minutes from ${daySchedule.startTime}.`);
    }
};
export const getDoctorAvailabilityService = async (doctorId, startDateStr, endDateStr) => {
    const start = toUtcDateOnly(startDateStr);
    const end = toUtcDateOnly(endDateStr);
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
    const scheduleMap = new Map();
    schedules.forEach((s) => scheduleMap.set(s.dayOfWeek, s));
    // Map existing booked appointments by "YYYY-MM-DD_HH:mm"
    const bookedSet = new Set();
    existingAppointments.forEach((app) => {
        const dateStr = toDateKey(toUtcDateOnly(app.appointmentDate));
        bookedSet.add(`${dateStr}_${normalizeTime(app.appointmentTime)}`);
    });
    const leaveRanges = leaves.map((leave) => ({
        from: toUtcDateOnly(leave.startDate),
        to: toUtcDateOnly(leave.endDate),
    }));
    const slots = [];
    const current = new Date(start);
    while (current <= end) {
        const dateStr = toDateKey(current);
        const dayOfWeek = current.getUTCDay(); // 0 = Sun, 1 = Mon ...
        const daySchedule = scheduleMap.get(dayOfWeek);
        // Blocked when the day falls inside any approved leave period
        const isLeave = leaveRanges.some((range) => current >= range.from && current <= range.to);
        if (isLeave || !daySchedule || !daySchedule.isWorkingDay) {
            // Entire day is blocked / off
            slots.push({
                date: dateStr,
                time: 'ALL_DAY',
                status: 'blocked',
            });
        }
        else {
            // Compute time slots based on working hours and slot duration
            const slotDuration = daySchedule.slotDurationMinutes || 30;
            let slotStartMinutes = parseTimeToMinutes(daySchedule.startTime);
            const slotEndMinutes = parseTimeToMinutes(daySchedule.endTime);
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
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return {
        doctorId,
        startDate: toDateKey(start),
        endDate: toDateKey(end),
        slots,
    };
};
export const setDoctorSchedulesService = async (doctorId, schedules, leaves, userId) => {
    const savedSchedules = await saveDoctorSchedulesRepository(doctorId, schedules, userId);
    let savedLeaves = [];
    if (leaves && leaves.length > 0) {
        savedLeaves = await Promise.all(leaves.map((leave) => addDoctorLeaveRepository(doctorId, {
            startDate: new Date(leave.startDate),
            endDate: new Date(leave.endDate),
            reason: leave.reason,
        }, userId)));
    }
    return {
        schedules: savedSchedules,
        leaves: savedLeaves,
    };
};
export const bookAppointmentService = async (input, userId) => {
    const appointmentDate = toUtcDateOnly(input.appointmentDate);
    if (isNaN(appointmentDate.getTime())) {
        throw new Error('INVALID_DATE: Invalid appointmentDate.');
    }
    const appointmentTime = normalizeTime(input.appointmentTime);
    // AM-004/AM-009: a slot the availability endpoint reports as blocked must not be bookable.
    if (input.doctorId) {
        await assertSlotIsOpen(input.doctorId, appointmentDate, appointmentTime);
    }
    return await createAppointmentWithTransaction({
        ...input,
        appointmentDate,
        appointmentTime,
    }, userId);
};
export const rescheduleAppointmentService = async (appointmentId, input, userId) => {
    const appointmentDate = toUtcDateOnly(input.appointmentDate);
    if (isNaN(appointmentDate.getTime())) {
        throw new Error('INVALID_DATE: Invalid appointmentDate.');
    }
    const appointmentTime = normalizeTime(input.appointmentTime);
    if (input.doctorId) {
        await assertSlotIsOpen(input.doctorId, appointmentDate, appointmentTime);
    }
    return await rescheduleAppointmentRepository(appointmentId, {
        ...input,
        appointmentDate,
        appointmentTime,
    }, userId);
};
export const cancelAppointmentService = async (appointmentId, reason, userId) => {
    if (!reason || reason.trim() === '') {
        throw new Error('REASON_REQUIRED: A valid reason is required for appointment cancellation.');
    }
    return await cancelAppointmentRepository(appointmentId, reason.trim(), userId);
};
export const updateAppointmentStatusService = async (appointmentId, status, userId, reason) => {
    const validStatuses = [
        'scheduled',
        'confirmed',
        'checked_in',
        'completed',
        'cancelled',
        'no_show',
    ];
    if (!validStatuses.includes(status)) {
        throw new Error(`INVALID_STATUS: Allowed statuses are ${validStatuses.join(', ')}`);
    }
    // AM-003: cancelling through the status endpoint carries the same reason mandate
    // as the dedicated cancel endpoint, so the audit trail can never lose it.
    if (status === 'cancelled' && (!reason || reason.trim() === '')) {
        throw new Error('REASON_REQUIRED: Cancelling an appointment requires a non-empty reason.');
    }
    return await updateAppointmentStatusRepository(appointmentId, status, userId, reason ? reason.trim() : undefined);
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
export const getAppointmentReportsService = async (filters) => {
    // Build a copy: mutating the caller's filter object leaked the widened endDate back
    // into the controller's request-scoped state.
    const scoped = { ...filters };
    if (scoped.startDate) {
        const start = toUtcDateOnly(scoped.startDate);
        if (isNaN(start.getTime())) {
            throw new Error('INVALID_DATE: Invalid startDate filter.');
        }
        scoped.startDate = start;
    }
    if (scoped.endDate) {
        const end = toUtcDateOnly(scoped.endDate);
        if (isNaN(end.getTime())) {
            throw new Error('INVALID_DATE: Invalid endDate filter.');
        }
        // Widen to end-of-day in UTC so the range stays inclusive of the final day.
        end.setUTCHours(23, 59, 59, 999);
        scoped.endDate = end;
    }
    if (scoped.startDate && scoped.endDate && scoped.startDate > scoped.endDate) {
        throw new Error('INVALID_DATE_RANGE: startDate cannot be after endDate.');
    }
    return await getAppointmentReportsRepository(scoped);
    if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        filters.endDate = end;
    }
    return await getAppointmentReportsRepository(filters);
};
