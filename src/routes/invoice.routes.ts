import { Router } from "express";
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoicesByPatient,
  updateInvoice,
  deleteInvoice
} from "../controllers/invoice.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { checkAbility } from "../middleware/authorization.middleware.js";

const router = Router();

router.use(authenticateToken);

router.post("/", checkAbility("create", "Billing"), createInvoice);
router.get("/", checkAbility("read", "Billing"), getAllInvoices);


router.get("/patient/:patientId", checkAbility("read", "Billing"), getInvoicesByPatient);
router.get("/:id", checkAbility("read", "Billing"), getInvoiceById);
router.put("/:id", checkAbility("update", "Billing"), updateInvoice);
router.delete("/:id", checkAbility("delete", "Billing"), deleteInvoice);

export default router;
