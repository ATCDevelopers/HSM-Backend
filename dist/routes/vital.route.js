import { Router } from "express";
import { vitalsController } from "../controllers/vital.controller.js";
import { authenticateToken } from '../middleware/auth.middleware.js';
import { checkAbility } from '../middleware/authorization.middleware.js';
const router = Router();
//Authentication globally to all vitals endpoints
router.use(authenticateToken);
router.post("/vitals", checkAbility("create", "Vitals"), vitalsController.create);
/**
 * @route   GET /api/vitals/patient/:patientId/audit
 * @desc    Allows clinicians to pull patient metrics sorted by timeframe selections
 * @query   ?timeframe=today | yesterday | lastweek | lastmonth | history
 * @note    MUST be placed above /:id so Express does not mistake the word 'patient' for an ID
 */
router.get("/patient/:patientId/audit", checkAbility("read", "Vitals"), vitalsController.getAuditedVitals);
router.get("/vitals/search", checkAbility("read", "Vitals"), vitalsController.searchByPatientName);
router.get("/vitals/:id", checkAbility("read", "Vitals"), vitalsController.getById);
router.get("/patient/:patientId", checkAbility("read", "Vitals"), vitalsController.getByPatientId);
router.patch("/vitals/:id", checkAbility("update", "Vitals"), vitalsController.update);
// router.delete(
//   "/vitals/:id", 
//  // checkAbility("delete", "vitals"), 
//   vitalsController.delete
// );
/**
 * @route   DELETE /api/vitals/:id
 * @desc    Compliant Soft Delete: Flags record as disabled instead of dropping row data
 */
router.delete("/:id", checkAbility("delete", "Vitals"), vitalsController.delete);
export default router;
