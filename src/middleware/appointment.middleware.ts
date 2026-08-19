import { Request, Response, NextFunction } from 'express';

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
  const { status } = req.body;
  const validStatuses = ['scheduled', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({
      error: `Invalid status parameter. Allowed values: ${validStatuses.join(', ')}`,
    });
    return;
  }

  next();
};
