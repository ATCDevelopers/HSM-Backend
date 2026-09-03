import { prescriptionItemService } from "../services/prescriptionItem.service.js";
/**
 * Handles adding a new line item to an active prescription.
 * POST /api/v1/prescription-items
 */
export async function createPrescriptionItem(req, res, next) {
    try {
        const item = await prescriptionItemService.createPrescriptionItem(req.body);
        res.status(201).json(item);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Fetches all prescription line items in the database.
 * GET /api/v1/prescription-items
 */
export async function getAllPrescriptionItems(req, res, next) {
    try {
        const items = await prescriptionItemService.getAllPrescriptionItems();
        res.status(200).json(items);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Fetches a single prescription item by its unique ID.
 * GET /api/v1/prescription-items/:id
 */
export async function getPrescriptionItemById(req, res, next) {
    try {
        const item = await prescriptionItemService.getPrescriptionItemById(req.params.id);
        res.status(200).json(item);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Fetches all prescription items attached to a specific parent prescription UUID.
 * GET /api/v1/prescription-items/prescription/:prescriptionId
 */
export async function getItemsByPrescriptionId(req, res, next) {
    try {
        const items = await prescriptionItemService.getItemsByPrescriptionId(req.params.prescriptionId);
        res.status(200).json(items);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Handles modifying medication properties or doses for a prescription line item.
 * PUT /api/v1/prescription-items/:id
 */
export async function updatePrescriptionItem(req, res, next) {
    try {
        const updated = await prescriptionItemService.updatePrescriptionItem(req.params.id, req.body);
        res.status(200).json(updated);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Removes an individual medication item line from a prescription chart.
 * DELETE /api/v1/prescription-items/:id
 */
export async function deletePrescriptionItem(req, res, next) {
    try {
        await prescriptionItemService.deletePrescriptionItem(req.params.id);
        res.status(204).end();
    }
    catch (error) {
        next(error);
    }
}
