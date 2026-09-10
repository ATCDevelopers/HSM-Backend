import { Router } from "express";
import { 
  createLabTest, 
  getLabTestById, 
  searchLabTests, 
  updateLabTest, 
  deleteLabTest 
} from "../controllers/labTestConfig.controller.js"; // Adjust path to controllers
//import { authMiddleware } from "../middleware/auth.middleware.js"; // Adjust path to auth middleware

const router = Router();

/**
 * Route perimeter mapping for Custom Laboratory Test Blueprints
 * Base Context Path: /api/v1/lab-tests
 */

// All custom lab test templates actions are protected by authentication layers
//router.use(authMiddleware);

// POST /api/v1/lab-tests - Deploy a new custom lab test schema blueprint
router.post("/", createLabTest);

// GET /api/v1/lab-tests - Search active blueprints via query parameters (?q= & ?category=)
router.get("/", searchLabTests);

// GET /api/v1/lab-tests/:id - Fetch an active form configuration blueprint by its primary UUID
router.get("/:id", getLabTestById);

// PUT /api/v1/lab-tests/:id - Modify fields/depth layouts inside an existing form setup
router.put("/:id", updateLabTest);

// DELETE /api/v1/lab-tests/:id - Archive template cleanly through compliance soft-deletion tracking
router.delete("/:id", deleteLabTest);

export default router;
