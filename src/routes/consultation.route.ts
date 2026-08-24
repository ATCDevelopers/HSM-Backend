
import { Router } from "express";
import { consultationController } from "../controllers/consultation.controller.js";
import { authenticateToken } from '../middleware/auth.middleware.js';
import { checkAbility } from '../middleware/authorization.middleware.js';
const router = Router();

// Secure all endpoints below with your global session validation
//router.use(authenticateToken);

/**
 * @route   POST /api/v1/consultation
 * @desc    Create a new clinical consultation log
 * @access  Protected (Requires 'write' on 'EMR')
 */
router.post(
  "/consultation", 
//  checkAbility("write", "EMR"), 
  consultationController.create
);

/**
 * @route   GET /api/v1/consultation/search
 * @desc    Search consultations filtering by the linked patient's full name
 * @query   ?name=John Doe
 * @note    Placed ABOVE /:id to prevent Express from confusing 'search' as an ID string
 */
router.get(
  "/consultation/search", 
 // checkAbility("read", "EMR"), 
  consultationController.searchByPatientName
);

/**
 * @route   GET /api/v1/consultation/:id
 * @desc    Fetch details for a single consultation entry by its direct ID
 */
router.get(
  "/consultation/:id", 
 // checkAbility("read", "EMR"), 
  consultationController.getById
);



/**
 * @route   GET /api/v1/consultation/patient/:patientId/audit
 * @desc    Allows doctors to audit logs filtered by timeframe selections
 * @query   ?timeframe=today | yesterday | history
 * @note    Placed ABOVE /:id pathing to guarantee pattern recognition priorities
 */
router.get(
  "/consultation/patient/:patientId/audit", 
 // checkAbility("read", "EMR"), 
  consultationController.getAuditedHistory
);

/**
 * @route   GET /api/v1/consultation/patient/:patientId
 * @desc    Fetch historical records linked directly to a patient UUID
 */
router.get(
  "/consultation/patient/:patientId", 
//  checkAbility("read", "EMR"), 
  consultationController.getByPatientId
);

/**
 * @route   PATCH /api/v1/consultation/:id
 * @desc    Alter selective text fields on an existing consultation record row
 */
router.patch(
  "/consultation/:id", 
//  checkAbility("update", "EMR"), 
  consultationController.update
);

/**
 * @route   DELETE /api/v1/consultation/:id
 * @desc    Remove a consultation record row out of your dataset entirely
 */
router.delete(
  "/consultation/:id", 
  //checkAbility("delete", "EMR"), 
  consultationController.delete
);

export default router;
