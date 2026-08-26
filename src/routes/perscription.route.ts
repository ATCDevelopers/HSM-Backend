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


router.post(
  "/perscriptions", 
  checkAbility("write", "Prescription"), 
  prescriptionsController.create
);


router.get(
  "/pescriptions/search", 
 checkAbility("read", "Prescription"), 
  prescriptionsController.searchByPatientName
);


router.get(
  "/perscriptions/:id", 
  checkAbility("read", "Prescription"), 
  prescriptionsController.getById
);


router.get(
  "/perscritions/patient/:patientId", 
  checkAbility("read", "Prescription"), 
  prescriptionsController.getByPatientId
);


router.patch(
  "/perscriptions/:id", 
  checkAbility("update", "Prescription"), 
  prescriptionsController.update
);


router.delete(
  "/perscriptions/:id", 
 checkAbility("delete", "Prescription"), 
  prescriptionsController.delete
);

export default router;
