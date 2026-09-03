/**
 * @file prescriptions.service.ts
 * @description Service layer managing clinical validation logic for medication prescriptions.
 * @author [Your Name Here]
 */
import { prescriptionsRepository } from "../repositories/perscription.respository.js";
export const prescriptionsService = {
    /**
     * Business validation for recording a new prescription row entry
     */
    async recordPrescription(data) {
        if (!data.patientId || !data.doctorId) {
            throw new Error("Both Patient ID and Doctor ID tracking fields are mandatory parameters.");
        }
        if (!data.statusId) {
            throw new Error("Initial prescription active execution status tracking profile is required.");
        }
        return await prescriptionsRepository.create(data);
    },
    /**
     * Fetch details for an isolated prescription row profile by its unique ID
     */
    async getPrescriptionById(id) {
        const record = await prescriptionsRepository.findById(id);
        if (!record) {
            throw new Error(`Medication prescription document with record ID ${id} not found.`);
        }
        return record;
    },
    /**
     * Retrieve complete medication history logs matching a specific patient UUID
     */
    async getPrescriptionsByPatient(patientId) {
        if (!patientId) {
            throw new Error("Valid Patient ID tracking key criteria must be provided.");
        }
        return await prescriptionsRepository.findByPatientId(patientId);
    },
    /**
     * Search through prescription tracking nodes using patient full-name text matches
     */
    async searchPrescriptionsByPatientName(name) {
        const trimmedName = name.trim();
        if (!trimmedName || trimmedName.length < 2) {
            throw new Error("Prescription query term entries must contain at least 2 characters.");
        }
        return await prescriptionsRepository.findByPatientName(trimmedName);
    },
    /**
     * Update active properties on a target prescription record row
     */
    async updatePrescription(id, data) {
        // Structural validation check to ensure database targeting matches a real row entry
        await this.getPrescriptionById(id);
        const updated = await prescriptionsRepository.update(id, data);
        if (!updated) {
            throw new Error("Failed to update prescription tracking target fields.");
        }
        return updated;
    },
    /**
     * Remove a prescription documentation entry row completely out of your cluster
     */
    async removePrescription(id) {
        await this.getPrescriptionById(id);
        const success = await prescriptionsRepository.delete(id);
        if (!success) {
            throw new Error("Failed to delete targeted medication prescription tracking entry from database.");
        }
    }
};
