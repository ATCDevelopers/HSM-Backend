import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  getDoctorAvailabilityService,
  setDoctorSchedulesService,
  bookAppointmentService,
  rescheduleAppointmentService,
  cancelAppointmentService,
  updateAppointmentStatusService,
  sendAppointmentRemindersService,
  getAppointmentReportsService,
} from '../services/appointment.service.js';

export const getDoctorAvailabilityController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const doctorId = req.params.doctorId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const result = await getDoctorAvailabilityService(doctorId, startDate, endDate);
    res.status(200).json({
      message: 'Doctor slot availability retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    if (error.message && error.message.startsWith('INVALID_DATE')) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to retrieve doctor availability' });
  }
};

export const setDoctorScheduleController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const doctorId = req.params.doctorId as string;
    const { schedules, leaves } = req.body;
    const userId = req.user?.id;

    const result = await setDoctorSchedulesService(doctorId, schedules, leaves, userId);
    res.status(200).json({
      message: 'Doctor schedule updated successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to configure doctor schedule' });
  }
};

export const createAppointmentController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const appointment = await bookAppointmentService(req.body, userId);

    res.status(201).json({
      message: 'Appointment booked successfully',
      data: appointment,
    });
  } catch (error: any) {
    if (error.message && error.message.startsWith('SLOT_BOOKED')) {
      res.status(409).json({ error: 'Conflict: The selected time slot is already booked for this doctor.' });
      return;
    }
    if (error.message && error.message.startsWith('INVALID_DATE')) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to book appointment' });
  }
};

export const rescheduleAppointmentController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const userId = req.user?.id;

    const updated = await rescheduleAppointmentService(appointmentId, req.body, userId);
    res.status(200).json({
      message: 'Appointment rescheduled successfully',
      data: updated,
    });
  } catch (error: any) {
    if (error.message && error.message.startsWith('NOT_FOUND')) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    if (error.message && error.message.startsWith('SLOT_BOOKED')) {
      res.status(409).json({ error: 'Conflict: Target time slot is already booked.' });
      return;
    }
    if (error.message && (error.message.startsWith('INVALID_STATE') || error.message.startsWith('INVALID_DATE'))) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to reschedule appointment' });
  }
};

export const cancelAppointmentController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const { reason } = req.body;
    const userId = req.user?.id;

    const cancelled = await cancelAppointmentService(appointmentId, reason, userId);
    res.status(200).json({
      message: 'Appointment cancelled successfully',
      data: cancelled,
    });
  } catch (error: any) {
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

export const updateAppointmentStatusController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const { status } = req.body;
    const userId = req.user?.id;

    const updated = await updateAppointmentStatusService(appointmentId, status, userId);
    res.status(200).json({
      message: 'Appointment status updated successfully',
      data: updated,
    });
  } catch (error: any) {
    if (error.message && error.message.startsWith('NOT_FOUND')) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    if (error.message && error.message.startsWith('INVALID_STATUS')) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to update appointment status' });
  }
};

export const sendRemindersController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const reminders = await sendAppointmentRemindersService();
    res.status(200).json({
      message: 'Appointment reminders queued successfully',
      data: reminders,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send appointment reminders' });
  }
};

export const getReportsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { doctorId, patientId, startDate, endDate, status } = req.query;

    const filters = {
      doctorId: doctorId ? (doctorId as string) : undefined,
      patientId: patientId ? (patientId as string) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as any,
    };

    const reports = await getAppointmentReportsService(filters);
    res.status(200).json({
      message: 'Appointment analytics and historical report generated',
      data: reports,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate appointment reports' });
  }
};
