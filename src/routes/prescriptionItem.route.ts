import { Router } from "express";
import {
  createPrescriptionItem,
  getAllPrescriptionItems,
  getPrescriptionItemById,
  getItemsByPrescriptionId,
  updatePrescriptionItem,
  deletePrescriptionItem,
} from "../controllers/prescriptionItem.controller.js"; // Import independent functions directly
import { authenticateToken } from '../middleware/auth.middleware.js';
import { checkAbility } from '../middleware/authorization.middleware.js';

const router = Router();
router.use(authenticateToken);

// Base collection endpoints
router.post("/prescription-items/", checkAbility('write', 'Prescription'),createPrescriptionItem);
router.get("/prescription-items",checkAbility('read', 'Prescription'), getAllPrescriptionItems);

// Parent prescription collection context routing path
router.get("/prescription-items/prescription/:prescriptionId", getItemsByPrescriptionId);

// Specific resource line items endpoints
router.get("/prescription-items/:id", getPrescriptionItemById);
router.put("/prescription-items/:id",updatePrescriptionItem);
router.delete("/prescription-items/:id",deletePrescriptionItem);

export default router;
