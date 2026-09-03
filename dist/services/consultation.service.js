/**
 * @file consultation.service.ts
 * @description Service layer handling business logic for clinical consultations.
 * @author [Your Name Here]
 */
import { consultationRepository } from "../repositories/consultation.repository.js";
export const consultationService = {
    /**
     * Business logic for creating a new consultation record
     */
    async recordConsultation(data) {
        if (!data.doctorId || !data.patientId) {
            throw new Error("Both Doctor ID and Patient ID are strictly required.");
        }
        if (!data.chiefComplaint || !data.historyOfPresentIllness) {
            throw new Error("Chief complaint and history of present illness are required fields.");
        }
        return await consultationRepository.create(data);
    },
    /**
     * Retrieve a specific consultation record by its unique ID
     */
    async getConsultationById(id) {
        const record = await consultationRepository.findById(id);
        if (!record) {
            throw new Error(`Consultation record with ID ${id} not found.`);
        }
        return record;
    },
    /**
     * Fetch all historical consultations for a specific patient UUID
     */
    async getConsultationsByPatient(patientId) {
        if (!patientId) {
            throw new Error("Valid Patient ID must be provided.");
        }
        return await consultationRepository.findByPatientId(patientId);
    },
    /**
       * ADVANCED: Evaluates time-frame string intents and calculates accurate Date boundaries
       * for data auditing (Today, Yesterday, or Full History).
       */
    async getConsultationsFiltered(patientId, timeframe) {
        if (!patientId) {
            throw new Error("Valid Patient ID tracking parameter must be provided.");
        }
        const now = new Date();
        let startDate;
        let endDate;
        // Convert timeframe to lower-case to avoid case mismatch bugs (e.g., "Today" vs "today")
        const scope = timeframe.trim().toLowerCase();
        switch (scope) {
            case "today": {
                // Today starting at midnight 00:00:00.000 local time
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            }
            case "yesterday": {
                // Yesterday starting exactly at 00:00:00.000 local time
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                // Ending exactly where Today began (prevents parsing skips)
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            }
            case "history":
            default:
                // Leaves parameters as undefined to bypass filters and retrieve everything
                break;
        }
        return await consultationRepository.findByPatientIdWithTimeframe(patientId, startDate, endDate);
    },
    /**
     * NEW: Search consultations by filtering against the patient's full name
     */
    async searchConsultationsByName(name) {
        const trimmedName = name.trim();
        if (!trimmedName || trimmedName.length < 2) {
            throw new Error("Search query must contain at least 2 characters.");
        }
        return await consultationRepository.findByPatientName(trimmedName);
    },
    /**
     * Modify an existing consultation entry
     */
    async updateConsultation(id, data) {
        // Structural verification check to ensure record exists first
        await this.getConsultationById(id);
        const updated = await consultationRepository.update(id, data);
        if (!updated) {
            throw new Error("Failed to patch consultation record properties.");
        }
        return updated;
    },
    /**
     * Permanently delete a consultation record
     */
    async removeConsultation(id) {
        await this.getConsultationById(id);
        const success = await consultationRepository.delete(id);
        if (!success) {
            throw new Error("Failed to delete consultation record from database.");
        }
    }
};
