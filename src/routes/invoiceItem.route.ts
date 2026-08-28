import { Router } from "express";
import {
  createInvoiceItem,
  getAllInvoiceItems,
  getInvoiceItemById,
  getItemsByInvoiceId,
  updateInvoiceItem,
  deleteInvoiceItem
} from "../controllers/invoiceItem.controller.js"; // Direct independent named imports

const router = Router();

// Base collection endpoints
router.post("/", createInvoiceItem);
router.get("/", getAllInvoiceItems);

// Parent resource lookup context endpoint mapping
router.get("/invoice/:invoiceId", getItemsByInvoiceId);

// Specific individual item endpoints 
router.get("/:id", getInvoiceItemById);
router.put("/:id", updateInvoiceItem);
router.delete("/:id", deleteInvoiceItem);

export default router;
