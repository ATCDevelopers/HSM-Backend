
import { Router } from "express";
import { consultationController } from "../controllers/consultation.controller.js";
import { authenticateToken } from '../middleware/auth.middleware.js';
import { checkAbility } from '../middleware/authorization.middleware.js';
const router = Router();

// Secure all endpoints below with your global session validation
router.use(authenticateToken);


router.post(
  "/consultation", 
  checkAbility("write", "Consultation"), 
  consultationController.create
);


router.get(
  "/consultation/search", 
  checkAbility("read", "Consultation"), 
  consultationController.searchByPatientName
);


router.get(
  "/consultation/:id", 
 checkAbility("read", "Consultation"), 
  consultationController.getById
);



router.get(
  "/consultation/patient/:patientId/audit", 
  checkAbility("read", "Consultation"), 
  consultationController.getAuditedHistory
);


router.get(
  "/consultation/patient/:patientId", 
  checkAbility("read", "Patient"), 
  consultationController.getByPatientId
);

router.patch(
  "/consultation/:id", 
  checkAbility("update", "Consultation"), 
  consultationController.update
);


router.delete(
  "/consultation/:id", 
  checkAbility("delete", "Consultation"), 
  consultationController.delete
);

export default router;
