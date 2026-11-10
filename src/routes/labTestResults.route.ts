import { Router } from "express";
import {
  submitTestResult,
  listTestResults,
  fetchTestResultById,
  fetchPatientTestHistory,
  updateTestResult,
  deleteTestResult
} from "../controllers/labTestResults.controller.js"; // Adjust path to controllers
import { authenticateToken } from "../middleware/auth.middleware.js";
import { checkAbility } from "../middleware/authorization.middleware.js";

const router = Router();

/**
 * Route perimeter mapping for Patient Laboratory Evaluation Results
 * Base Context Path: /api/v1/test-results
 */

// All lab test result entry operations are locked down behind authentication layers
router.use(authenticateToken);

// POST /api/v1/test-results - Submit a lab technician's filled data entry for a patient
router.post("/", checkAbility("create", "Laboratory"), submitTestResult);

// GET /api/v1/test-results - Results inbox (doctors see only results sent to them)
router.get("/", checkAbility("read", "Laboratory"), listTestResults);

// GET /api/v1/test-results/:id - Pull a single test result combined with its structural form design template
router.get("/:id", checkAbility("read", "Laboratory"), fetchTestResultById);

// GET /api/v1/test-results/patient/:patientId - Retrieve the complete active evaluation record roadmap for a patient
router.get("/patient/:patientId", checkAbility("read", "Laboratory"), fetchPatientTestHistory);

// PUT /api/v1/test-results/:id - Correct recorded metrics or append additional clinical overview remarks
router.put("/:id", checkAbility("update", "Laboratory"), updateTestResult);

// DELETE /api/v1/test-results/:id - Archive a submitted evaluation record via compliance soft-deletion tracking
router.delete("/:id", checkAbility("delete", "Laboratory"), deleteTestResult);

export default router;
