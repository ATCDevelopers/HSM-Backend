/**
 * @file prescription.route.ts
 * @description Route layer mapping endpoints to prescription controller methods with authority checks.
 * Mounted at /api/v1/prescriptions.
 */

import { Router } from "express";
import { prescriptionsController } from "../controllers/prescription.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { checkAbility } from '../middleware/authorization.middleware.js';
const router = Router();

// Enforce session authentication globally on all medication endpoints
router.use(authenticateToken);


router.post(
  "/",
  checkAbility("write", "Prescription"),
  prescriptionsController.create
);


// Pharmacy queue (?status=pending|dispensed|cancelled)
router.get(
  "/",
  checkAbility("read", "Prescription"),
  prescriptionsController.list
);


// Deducts stock and marks the prescription dispensed in one transaction
router.post(
  "/:id/dispense",
  checkAbility("update", "Prescription"),
  prescriptionsController.dispense
);


router.get(
  "/search",
  checkAbility("read", "Prescription"),
  prescriptionsController.searchByPatientName
);


router.get(
  "/patient/:patientId",
  checkAbility("read", "Prescription"),
  prescriptionsController.getByPatientId
);


router.get(
  "/:id",
  checkAbility("read", "Prescription"),
  prescriptionsController.getById
);


router.patch(
  "/:id",
  checkAbility("update", "Prescription"),
  prescriptionsController.update
);


router.delete(
  "/:id",
  checkAbility("delete", "Prescription"),
  prescriptionsController.delete
);

export default router;
