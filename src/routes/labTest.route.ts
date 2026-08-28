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
router.post("/lab-test/", createLabTest);
router.get("/lab-test/", getAllLabTests);

// Specific resource item endpoints
router.get("/lab-test/:id", getLabTestById);
router.put("/lab-test/:id", updateLabTest);
router.delete("/lab-test/:id", deleteLabTest);

export default router;
