import { invoiceItemService } from "../services/invoiceItem.service.js";
/**
 * Handles appending a new itemized charge line to an active invoice container.
 * POST /api/v1/invoice-items
 */
export async function createInvoiceItem(req, res, next) {
    try {
        const item = await invoiceItemService.createInvoiceItem(req.body);
        res.status(201).json(item);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Fetches every single itemized ledger line registered globally.
 * GET /api/v1/invoice-items
 */
export async function getAllInvoiceItems(req, res, next) {
    try {
        const items = await invoiceItemService.getAllInvoiceItems();
        res.status(200).json(items);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Fetches a single invoice line item by its primary UUID parameter.
 * GET /api/v1/invoice-items/:id
 */
export async function getInvoiceItemById(req, res, next) {
    try {
        const item = await invoiceItemService.getInvoiceItemById(req.params.id);
        res.status(200).json(item);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Fetches all child line items belonging to a specific parent invoice container.
 * GET /api/v1/invoice-items/invoice/:invoiceId
 */
export async function getItemsByInvoiceId(req, res, next) {
    try {
        const items = await invoiceItemService.getItemsByInvoiceId(req.params.invoiceId);
        res.status(200).json(items);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Handles modifying structural columns inside an existing invoice line item structure.
 * PUT /api/v1/invoice-items/:id
 */
export async function updateInvoiceItem(req, res, next) {
    try {
        const updated = await invoiceItemService.updateInvoiceItem(req.params.id, req.body);
        res.status(200).json(updated);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Permanently erases a targeted item line from an invoice chart.
 * DELETE /api/v1/invoice-items/:id
 */
export async function deleteInvoiceItem(req, res, next) {
    try {
        await invoiceItemService.deleteInvoiceItem(req.params.id);
        res.status(204).end();
    }
    catch (error) {
        next(error);
    }
}
