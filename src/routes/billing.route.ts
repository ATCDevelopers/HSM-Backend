import { Router } from "express";
import { billingController } from "../controllers/billing.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { checkAbility } from "../middleware/authorization.middleware.js";

// Mounted at /api/v1/billing. Billing-only: clinical roles have no Billing rule, so every route is closed to them.
const router = Router();

router.use(authenticateToken);

// Price list (auto-discovered services; prices set by billing staff)
router.get("/services", checkAbility("read", "Billing"), billingController.listServices);
router.post("/services", checkAbility("create", "Billing"), billingController.createService);
router.patch("/services/:id", checkAbility("update", "Billing"), billingController.updateService);

// What a patient owes: open to reception (PatientBalance) as well as billing, without exposing the rest of billing
router.get("/balance/:patientId", checkAbility("read", "PatientBalance"), billingController.patientBalance);

// Charges recorded automatically as patients receive services
router.get("/charges", checkAbility("read", "Billing"), billingController.listCharges);
router.post("/charges", checkAbility("create", "Billing"), billingController.addCharge);
router.patch("/charges/:id/waive", checkAbility("update", "Billing"), billingController.waiveCharge);
router.post("/charges/invoice", checkAbility("create", "Billing"), billingController.invoiceCharges);

export default router;
