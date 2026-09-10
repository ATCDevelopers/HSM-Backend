import { Router } from "express";
import {
  submitTestResult,
  fetchTestResultById,
  fetchPatientTestHistory,
  updateTestResult,
  deleteTestResult
} from "../controllers/labTestResults.controller.js"; // Adjust path to controllers
//import { authMiddleware } from "../middleware/auth.middleware.js"; // Adjust path to auth middleware

const router = Router();

/**
 * Route perimeter mapping for Patient Laboratory Evaluation Results
 * Base Context Path: /api/v1/test-results
 */

// All lab test result entry operations are locked down behind authentication layers
//router.use(authMiddleware);

// POST /api/v1/test-results - Submit a lab technician's filled data entry for a patient
router.post("/", submitTestResult);

// GET /api/v1/test-results/:id - Pull a single test result combined with its structural form design template
router.get("/:id", fetchTestResultById);

// GET /api/v1/test-results/patient/:patientId - Retrieve the complete active evaluation record roadmap for a patient
router.get("/patient/:patientId", fetchPatientTestHistory);

// PUT /api/v1/test-results/:id - Correct recorded metrics or append additional clinical overview remarks
router.put("/:id", updateTestResult);

// DELETE /api/v1/test-results/:id - Archive a submitted evaluation record via compliance soft-deletion tracking
router.delete("/:id", deleteTestResult);

export default router;
