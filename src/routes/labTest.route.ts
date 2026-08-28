import { Router } from "express";
import {
  createLabTest,
  getAllLabTests,
  getLabTestById,
  updateLabTest,
  deleteLabTest,
} from "../controllers/labTest.controller.js"; // Import independent functions directly

import { authenticateToken } from '../middleware/auth.middleware.js';
import { checkAbility } from '../middleware/authorization.middleware.js';

const router = Router();
router.use(authenticateToken);



// Base collection endpoints
router.post("/", createLabTest);
router.get("/", getAllLabTests);

// Specific resource item endpoints
router.get("/:id", getLabTestById);
router.put("/:id", updateLabTest);
router.delete("/:id", deleteLabTest);

export default router;
