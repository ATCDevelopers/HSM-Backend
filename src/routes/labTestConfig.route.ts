import { Router } from "express";
import { 
  createLabTest, 
  getLabTestById, 
  searchLabTests, 
  updateLabTest, 
  deleteLabTest 
} from "../controllers/labTestConfig.controller.js"; // Adjust path to controllers
import { authenticateToken } from "../middleware/auth.middleware.js";
import { checkAbility } from "../middleware/authorization.middleware.js";

const router = Router();

/**
 * Route perimeter mapping for Custom Laboratory Test Blueprints
 * Base Context Path: /api/v1/lab-tests
 */

// All custom lab test templates actions are protected by authentication layers
router.use(authenticateToken);

// POST /api/v1/lab-tests - Deploy a new custom lab test schema blueprint
router.post("/", checkAbility("create", "Lab_test"), createLabTest);

// GET /api/v1/lab-tests - Search active blueprints via query parameters (?q= & ?category=)
router.get("/", checkAbility("read", "Lab_test"), searchLabTests);

// GET /api/v1/lab-tests/:id - Fetch an active form configuration blueprint by its primary UUID
router.get("/:id", checkAbility("read", "Lab_test"), getLabTestById);

// PUT /api/v1/lab-tests/:id - Modify fields/depth layouts inside an existing form setup
router.put("/:id", checkAbility("update", "Lab_test"), updateLabTest);

// DELETE /api/v1/lab-tests/:id - Archive template cleanly through compliance soft-deletion tracking
router.delete("/:id", checkAbility("delete", "Lab_test"), deleteLabTest);

export default router;
