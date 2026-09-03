import { getDoctorAvailabilityService, setDoctorSchedulesService, bookAppointmentService, rescheduleAppointmentService, cancelAppointmentService, updateAppointmentStatusService, sendAppointmentRemindersService, getAppointmentReportsService, } from '../services/appointment.service.js';
/**
 * `checkAbility('read', 'Report')` only proves the role holds *some* Report rule; CASL
 * cannot apply an attribute condition to a subject type. These two roles are the only
 * ones whose rule is unconditional (`manage all` / `manage Report`), plus Receptionist
 * who needs the full front-desk board to book against. Everyone else is narrowed below.
 */
const UNRESTRICTED_REPORT_ROLES = ['Admin', 'ClinicManager', 'Receptionist'];
export const getDoctorAvailabilityController = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const result = await getDoctorAvailabilityService(doctorId, startDate, endDate);
        res.status(200).json({
            message: 'Doctor slot availability retrieved successfully',
            data: result,
        });
    }
    catch (error) {
        if (error.message && error.message.startsWith('INVALID_DATE')) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: error.message || 'Failed to retrieve doctor availability' });
    }
};
export const setDoctorScheduleController = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        const { schedules, leaves } = req.body;
        const userId = req.user?.id;
        const result = await setDoctorSchedulesService(doctorId, schedules, leaves, userId);
        res.status(200).json({
            message: 'Doctor schedule updated successfully',
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to configure doctor schedule' });
    }
};
export const createAppointmentController = async (req, res) => {
    try {
        const userId = req.user?.id;
        const appointment = await bookAppointmentService(req.body, userId);
        res.status(201).json({
            message: 'Appointment booked successfully',
            data: appointment,
        });
    }
    catch (error) {
        if (error.message && error.message.startsWith('SLOT_BOOKED')) {
            res.status(409).json({ error: 'Conflict: The selected time slot is already booked for this doctor.' });
            return;
        }
        if (error.message && error.message.startsWith('DOCTOR_ON_LEAVE')) {
            res.status(409).json({ error: error.message.replace(/^DOCTOR_ON_LEAVE:\s*/, 'Conflict: ') });
            return;
        }
        if (error.message && error.message.startsWith('OUTSIDE_SCHEDULE')) {
            res.status(409).json({ error: error.message.replace(/^OUTSIDE_SCHEDULE:\s*/, 'Conflict: ') });
            return;
        }
        if (error.message && error.message.startsWith('INVALID_SLOT')) {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error.message && error.message.startsWith('INVALID_DATE')) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: error.message || 'Failed to book appointment' });
    }
};
export const rescheduleAppointmentController = async (req, res) => {
    try {
        const appointmentId = req.params.appointmentId;
        const userId = req.user?.id;
        const updated = await rescheduleAppointmentService(appointmentId, req.body, userId);
        res.status(200).json({
            message: 'Appointment rescheduled successfully',
            data: updated,
        });
    }
    catch (error) {
        if (error.message && error.message.startsWith('NOT_FOUND')) {
            res.status(404).json({ error: 'Appointment not found' });
            return;
        }
        if (error.message && error.message.startsWith('SLOT_BOOKED')) {
            res.status(409).json({ error: 'Conflict: Target time slot is already booked.' });
            return;
        }
        if (error.message && error.message.startsWith('DOCTOR_ON_LEAVE')) {
            res.status(409).json({ error: error.message.replace(/^DOCTOR_ON_LEAVE:\s*/, 'Conflict: ') });
            return;
        }
        if (error.message && error.message.startsWith('OUTSIDE_SCHEDULE')) {
            res.status(409).json({ error: error.message.replace(/^OUTSIDE_SCHEDULE:\s*/, 'Conflict: ') });
            return;
        }
        if (error.message && error.message.startsWith('INVALID_SLOT')) {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error.message && (error.message.startsWith('INVALID_STATE') || error.message.startsWith('INVALID_DATE'))) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: error.message || 'Failed to reschedule appointment' });
    }
};
export const cancelAppointmentController = async (req, res) => {
    try {
        const appointmentId = req.params.appointmentId;
        const { reason } = req.body;
        const userId = req.user?.id;
        const cancelled = await cancelAppointmentService(appointmentId, reason, userId);
        res.status(200).json({
            message: 'Appointment cancelled successfully',
            data: cancelled,
        });
    }
    catch (error) {
        if (error.message && error.message.startsWith('NOT_FOUND')) {
            res.status(404).json({ error: 'Appointment not found' });
            return;
        }
        if (error.message && error.message.startsWith('REASON_REQUIRED')) {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error.message && error.message.startsWith('ALREADY_CANCELLED')) {
            res.status(400).json({ error: 'Appointment is already cancelled' });
            return;
        }
        res.status(500).json({ error: error.message || 'Failed to cancel appointment' });
    }
};
export const updateAppointmentStatusController = async (req, res) => {
    try {
        const appointmentId = req.params.appointmentId;
        const { status, reason } = req.body;
        const userId = req.user?.id;
        const updated = await updateAppointmentStatusService(appointmentId, status, userId, reason);
        res.status(200).json({
            message: 'Appointment status updated successfully',
            data: updated,
        });
    }
    catch (error) {
        if (error.message && error.message.startsWith('NOT_FOUND')) {
            res.status(404).json({ error: 'Appointment not found' });
            return;
        }
        if (error.message && error.message.startsWith('INVALID_TRANSITION')) {
            res.status(409).json({ error: error.message.replace(/^INVALID_TRANSITION:\s*/, 'Conflict: ') });
            return;
        }
        if (error.message && error.message.startsWith('REASON_REQUIRED')) {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error.message && error.message.startsWith('INVALID_STATUS')) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: error.message || 'Failed to update appointment status' });
    }
};
export const sendRemindersController = async (req, res) => {
    try {
        const reminders = await sendAppointmentRemindersService();
        res.status(200).json({
            message: 'Appointment reminders queued successfully',
            data: reminders,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to send appointment reminders' });
    }
};
export const getReportsController = async (req, res) => {
    try {
        const { doctorId, patientId, startDate, endDate, status } = req.query;
        const role = req.user?.role ?? '';
        const requesterId = req.user?.id;
        const filters = {
            doctorId: doctorId ? doctorId : undefined,
            patientId: patientId ? patientId : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status: status,
        };
        // Force the attribute condition CASL declared but could not enforce at the type level.
        if (!UNRESTRICTED_REPORT_ROLES.includes(role)) {
            if (role === 'Doctor') {
                filters.doctorId = requesterId;
            }
            else if (role === 'Patient') {
                filters.patientId = requesterId;
            }
            else {
                res.status(403).json({
                    error: 'Forbidden: appointment reports are limited to your own records, and no ownership scope is defined for your role.',
                });
                return;
            }
        }
        const reports = await getAppointmentReportsService(filters);
        res.status(200).json({
            message: 'Appointment analytics and historical report generated',
            data: reports,
        });
    }
    catch (error) {
        if (error.message && error.message.startsWith('INVALID_DATE')) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: error.message || 'Failed to generate appointment reports' });
    }
};
