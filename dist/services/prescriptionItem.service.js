import { prescriptionItemRepository } from "../repositories/prescriptionItem.repository.js";
export const prescriptionItemService = {
    /**
     * Appends an item to a prescription after validating medical quantity thresholds.
     */
    async createPrescriptionItem(data) {
        // Rule 1: Ensure total quantity to dispense is greater than zero
        if (data.quantity <= 0) {
            throw new Error("Prescription item quantity must be greater than zero");
        }
        // Rule 2: Ensure intake frequency is a valid positive value
        if (Number(data.frequency) <= 0) {
            throw new Error("Prescription item frequency must be a positive number greater than zero");
        }
        return prescriptionItemRepository.create(data);
    },
    /**
     * Retrieves a single prescription item row or throws a structured error.
     */
    async getPrescriptionItemById(id) {
        const item = await prescriptionItemRepository.findById(id);
        if (!item) {
            throw new Error(`Prescription item with ID '${id}' was not found`);
        }
        return item;
    },
    /**
     * Fetches every individual prescription line item registered in the database.
     */
    async getAllPrescriptionItems() {
        return prescriptionItemRepository.findAll();
    },
    /**
     * Fetches all items associated with a parent prescription collection.
     */
    async getItemsByPrescriptionId(prescriptionId) {
        return prescriptionItemRepository.findByPrescriptionId(prescriptionId);
    },
    /**
     * Modifies an existing prescription item record after executing clinical safety checks.
     */
    async updatePrescriptionItem(id, data) {
        // Confirm target resource exists before applying adjustments
        await this.getPrescriptionItemById(id);
        // Rule 3: Guard quantity adjustments against zero or negative metrics
        if (data.quantity !== undefined && data.quantity <= 0) {
            throw new Error("Updated prescription item quantity must be greater than zero");
        }
        // Rule 4: Guard frequency adjustments against zero or negative metrics
        if (data.frequency !== undefined && Number(data.frequency) <= 0) {
            throw new Error("Updated prescription item frequency must be a positive number greater than zero");
        }
        const updated = await prescriptionItemRepository.update(id, data);
        if (!updated) {
            throw new Error("Failed to modify prescription item record");
        }
        return updated;
    },
    /**
     * Safely deletes an individual line item from a prescription.
     */
    async deletePrescriptionItem(id) {
        await this.getPrescriptionItemById(id);
        const deleted = await prescriptionItemRepository.delete(id);
        if (!deleted) {
            throw new Error("Failed to remove prescription item from the database");
        }
        return deleted;
    }
};
