import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { checkAbility } from '../middleware/authorization.middleware.js';
import {
  validateAvailabilityQuery,
  validateDoctorScheduleInput,
  validateBookAppointmentInput,
  validateRescheduleInput,
  validateCancelInput,
  validateStatusInput,
} from '../middleware/appointment.middleware.js';
import {
  getDoctorAvailabilityController,
  setDoctorScheduleController,
  createAppointmentController,
  rescheduleAppointmentController,
  cancelAppointmentController,
  updateAppointmentStatusController,
  sendRemindersController,
  getReportsController,
} from '../controllers/appointment.controller.js';

const router = express.Router();

// 1. Doctor Schedules & Availability
router.get(
  '/doctors/:doctorId/availability',
  authenticateToken,
  checkAbility('read', 'Appointment'),
  validateAvailabilityQuery,
  getDoctorAvailabilityController
);

router.post(
  '/doctors/:doctorId/schedules',
  authenticateToken,
  checkAbility('manage', 'Appointment'),
  validateDoctorScheduleInput,
  setDoctorScheduleController
);

// 2. Appointment Booking & Operations
router.post(
  '/appointments',
  authenticateToken,
  checkAbility('create', 'Appointment'),
  validateBookAppointmentInput,
  createAppointmentController
);

router.put(
  '/appointments/:appointmentId/reschedule',
  authenticateToken,
  checkAbility('update', 'Appointment'),
  validateRescheduleInput,
  rescheduleAppointmentController
);

router.patch(
  '/appointments/:appointmentId/cancel',
  authenticateToken,
  checkAbility('update', 'Appointment'),
  validateCancelInput,
  cancelAppointmentController
);

router.patch(
  '/appointments/:appointmentId/status',
  authenticateToken,
  checkAbility('update', 'Appointment'),
  validateStatusInput,
  updateAppointmentStatusController
);

// 3. Background Processing & Reporting
router.post(
  '/appointments/send-reminders',
  authenticateToken,
  checkAbility('manage', 'Appointment'),
  sendRemindersController
);

router.get(
  '/appointments/reports',
  authenticateToken,
  checkAbility('read', 'Report'),
  getReportsController
);

export default router;
