import { Request, Response, NextFunction } from 'express';

/** 24-hour HH:mm. Slot keys are compared as strings, so the format has to be exact. */
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const validateAvailabilityQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    res.status(400).json({ error: 'Missing required query parameters: startDate and endDate are required.' });
    return;
  }

  if (isNaN(Date.parse(startDate as string)) || isNaN(Date.parse(endDate as string))) {
    res.status(400).json({ error: 'Invalid date format. Expected valid ISO or YYYY-MM-DD date strings.' });
    return;
  }

  next();
};

export const validateDoctorScheduleInput = (req: Request, res: Response, next: NextFunction): void => {
  const { schedules } = req.body;

  if (!schedules || !Array.isArray(schedules)) {
    res.status(400).json({ error: 'Request body must contain a "schedules" array.' });
    return;
  }

  for (const s of schedules) {
    if (typeof s.dayOfWeek !== 'number' || s.dayOfWeek < 0 || s.dayOfWeek > 6) {
      res.status(400).json({ error: 'Each schedule entry must contain a valid dayOfWeek (0 for Sunday to 6 for Saturday).' });
      return;
    }
    if (!s.startTime || !s.endTime) {
      res.status(400).json({ error: 'Each schedule entry must contain "startTime" and "endTime" (e.g. "08:00").' });
      return;
    }
    if (!TIME_PATTERN.test(s.startTime) || !TIME_PATTERN.test(s.endTime)) {
      res.status(400).json({ error: 'startTime and endTime must use 24-hour HH:mm format (e.g. "08:00", "17:30").' });
      return;
    }
    if (toMinutes(s.startTime) >= toMinutes(s.endTime)) {
      res.status(400).json({ error: `Invalid working hours for dayOfWeek ${s.dayOfWeek}: startTime must be earlier than endTime.` });
      return;
    }
    if (
      s.slotDurationMinutes !== undefined &&
      (!Number.isInteger(s.slotDurationMinutes) || s.slotDurationMinutes <= 0)
    ) {
      res.status(400).json({ error: 'slotDurationMinutes must be a positive whole number of minutes.' });
      return;
    }
    if (
      s.slotDurationMinutes !== undefined &&
      s.slotDurationMinutes > toMinutes(s.endTime) - toMinutes(s.startTime)
    ) {
      res.status(400).json({ error: `slotDurationMinutes is longer than the working window for dayOfWeek ${s.dayOfWeek}, so no slot would ever be produced.` });
      return;
    }
  }

  next();
};

export const validateBookAppointmentInput = (req: Request, res: Response, next: NextFunction): void => {
  const { patientId, appointmentType, reason, appointmentDate, appointmentTime } = req.body;

  if (!patientId || !appointmentType || !reason || !appointmentDate || !appointmentTime) {
    res.status(400).json({
      error: 'Missing required fields. Required: patientId, appointmentType, reason, appointmentDate, appointmentTime.',
    });
    return;
  }

  if (isNaN(Date.parse(appointmentDate))) {
    res.status(400).json({ error: 'Invalid appointmentDate format.' });
    return;
  }

  if (!TIME_PATTERN.test(appointmentTime)) {
    res.status(400).json({ error: 'appointmentTime must use 24-hour HH:mm format (e.g. "09:00", "14:30").' });
    return;
  }

  next();
};

export const validateRescheduleInput = (req: Request, res: Response, next: NextFunction): void => {
  const { appointmentDate, appointmentTime } = req.body;

  if (!appointmentDate || !appointmentTime) {
    res.status(400).json({ error: 'Missing required fields. Required: appointmentDate and appointmentTime.' });
    return;
  }

  if (isNaN(Date.parse(appointmentDate))) {
    res.status(400).json({ error: 'Invalid appointmentDate format.' });
    return;
  }

  if (!TIME_PATTERN.test(appointmentTime)) {
    res.status(400).json({ error: 'appointmentTime must use 24-hour HH:mm format (e.g. "09:00", "14:30").' });
    return;
  }

  next();
};

export const validateCancelInput = (req: Request, res: Response, next: NextFunction): void => {
  const { reason } = req.body;

  if (!reason || typeof reason !== 'string' || reason.trim() === '') {
    res.status(400).json({ error: 'Cancellation mandate: A non-empty "reason" string payload is required for auditing.' });
    return;
  }

  next();
};

export const validateStatusInput = (req: Request, res: Response, next: NextFunction): void => {
  const { status, reason } = req.body;
  const validStatuses = ['scheduled', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({
      error: `Invalid status parameter. Allowed values: ${validStatuses.join(', ')}`,
    });
    return;
  }

  // Closing the back door: a cancellation routed through this endpoint owes the same
  // audit reason the dedicated cancel endpoint demands (AM-003).
  if (status === 'cancelled' && (!reason || typeof reason !== 'string' || reason.trim() === '')) {
    res.status(400).json({
      error: 'Cancellation mandate: setting status to "cancelled" requires a non-empty "reason" string payload for auditing.',
    });
    return;
  }

  next();
};
