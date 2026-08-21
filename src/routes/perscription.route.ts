/**
 * @file prescriptions.routes.ts
 * @description Route layer mapping endpoints to prescription controller methods with authority checks.
 * @author [Your Name Here]
 */

import { Router } from "express";
import { prescriptionsController } from "../controllers/perscription.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js"; // Path to your auth middleware
import { checkAbility } from '../middleware/authorization.middleware.js';
const router = Router();

// Enforce session authentication globally on all medication endpoints
router.use(authenticateToken);

/**
 * @route   POST /api/v1/prescriptions
 * @desc    Create a new patient medical prescription record
 * @access  Protected (Requires 'write' on 'EMR' - Doctor authority)
 */
router.post(
  "/perscriptions", 
  //checkAbility("write", "EMR"), 
  prescriptionsController.create
);

/**
 * @route   GET /api/v1/prescriptions/search
 * @desc    Search medication prescription records using a patient's full name
 * @query   ?name=Jane Doe
 * @note    Placed ABOVE generic /:id to prevent routing evaluation collisions
 */
router.get(
  "/pescriptions/search", 
 //checkAbility("read", "EMR"), 
  prescriptionsController.searchByPatientName
);

/**
 * @route   GET /api/v1/prescriptions/:id
 * @desc    Get an isolated prescription profile by its unique document ID
 */
router.get(
  "/perscriptions/:id", 
  //checkAbility("read", "EMR"), 
  prescriptionsController.getById
);

/**
 * @route   GET /api/v1/prescriptions/patient/:patientId
 * @desc    Fetch all historical medication sheets logged for a specific patient
 */
router.get(
  "/perscritions/patient/:patientId", 
 // checkAbility("read", "EMR"), 
  prescriptionsController.getByPatientId
);

/**
 * @route   PATCH /api/v1/prescriptions/:id
 * @desc    Update selective tracking fields or change status flags on an entry
 */
router.patch(
  "/perscriptions/:id", 
 // checkAbility("update", "EMR"), 
  prescriptionsController.update
);

/**
 * @route   DELETE /api/v1/prescriptions/:id
 * @desc    Permanently wipe a prescription profile entry out of the system
 */
router.delete(
  "/perscriptions/:id", 
 // checkAbility("delete", "EMR"), 
  prescriptionsController.delete
);

export default router;
