import { Router } from "express";
import {
  createInvoiceItem,
  getAllInvoiceItems,
  getInvoiceItemById,
  getItemsByInvoiceId,
  updateInvoiceItem,
  deleteInvoiceItem
} from "../controllers/invoiceItem.controller.js"; // Direct independent named imports
import { authenticateToken } from "../middleware/auth.middleware.js";
import { checkAbility } from "../middleware/authorization.middleware.js";

const router = Router();

router.use(authenticateToken);

// Base collection endpoints
router.post("/", checkAbility("create", "Billing"), createInvoiceItem);
router.get("/", checkAbility("read", "Billing"), getAllInvoiceItems);

// Parent resource lookup context endpoint mapping
router.get("/invoice/:invoiceId", checkAbility("read", "Billing"), getItemsByInvoiceId);

// Specific individual item endpoints
router.get("/:id", checkAbility("read", "Billing"), getInvoiceItemById);
router.put("/:id", checkAbility("update", "Billing"), updateInvoiceItem);
router.delete("/:id", checkAbility("delete", "Billing"), deleteInvoiceItem);

export default router;
