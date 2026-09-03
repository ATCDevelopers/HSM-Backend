/**
 * @file vitals.service.ts
 * @description Service layer handling business logic for patient vitals.
 * @author [Your Name Here]
 */
import { vitalsRepository } from "../repositories/vitals.repository.js";
export const vitalsService = {
    /**
     * Business logic for logging a patient's vitals
     */
    async recordVitals(data) {
        // Add business rules here (e.g., checking if patient is currently admitted)
        if (!data.patientId) {
            throw new Error("Patient ID is strictly required to log vitals.");
        }
        return await vitalsRepository.create(data);
    },
    /**
     * Retrieve a specific vitals entry by ID
     */
    async getVitalsById(id) {
        const vitals = await vitalsRepository.findById(id);
        if (!vitals) {
            throw new Error(`Vitals record with ID ${id} not found.`);
        }
        return vitals;
    },
    /**
     * Retrieve historical vitals logs for a specific patient
     */
    async getVitalsByPatientId(patientId) {
        if (!patientId) {
            throw new Error("Valid Patient ID must be provided.");
        }
        return await vitalsRepository.findByPatientId(patientId);
    },
    /**
     * Search vitals entries using a patient's name
     */
    async searchVitalsByPatientName(name) {
        const trimmedName = name.trim();
        if (!trimmedName || trimmedName.length < 2) {
            throw new Error("Search term must be at least 2 characters long.");
        }
        return await vitalsRepository.findByPatientName(trimmedName);
    },
    /**
     * Modify existing vitals data
     */
    async updateVitals(id, data) {
        // Ensure the record actually exists before trying to update it
        await this.getVitalsById(id);
        const updatedVitals = await vitalsRepository.update(id, data);
        if (!updatedVitals) {
            throw new Error("Failed to update vitals record.");
        }
        return updatedVitals;
    },
    /**
     * ADVANCED: Evaluates time-frame string options and sets exact Date boundaries
     * for data auditing (Today, Yesterday, Last Week, Last Month, or History).
     */
    async getVitalsHistoryFiltered(patientId, timeframe) {
        if (!patientId) {
            throw new Error("Valid Patient ID tracking parameter must be provided.");
        }
        const now = new Date();
        let startDate;
        let endDate;
        // Convert timeframe to lower-case to avoid case-mismatch bugs
        const scope = timeframe.trim().toLowerCase();
        switch (scope) {
            case "today": {
                // Today starting at midnight 00:00:00.000 local server time
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            }
            case "yesterday": {
                // Yesterday starting exactly at 00:00:00.000 local time
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                // Ending exactly where Today began (midnight today)
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            }
            case "lastweek": {
                // Looks back exactly 7 full days (7 * 24 hours) from this millisecond
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            }
            case "lastmonth": {
                // Looks back exactly 30 standard days (30 * 24 hours) from this millisecond
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            }
            case "history":
            default:
                // Leaves parameters as undefined to skip filters and retrieve all history records
                break;
        }
        return await vitalsRepository.findByPatientIdWithTimeframe(patientId, startDate, endDate);
    },
    ///////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////
    /**
     * Safe compliant soft-deletion orchestration block.
     * Flags the record as disabled rather than hard-deleting the row.
     */
    async removeVitals(id) {
        await this.getVitalsById(id); // Throws error if already missing or soft-deleted
        const success = await vitalsRepository.softDelete(id);
        if (!success) {
            throw new Error("Failed to execute compliant soft-deletion on targeted vitals row.");
        }
    },
    /**
     * Administrative Compliance Tool: Restores a soft-deleted vitals log back to the active pool
     */
    async restoreVitals(id) {
        const success = await vitalsRepository.recoverDeletedVitals(id);
        if (!success) {
            throw new Error("Failed to restore targeted vitals log profile. Record may not exist.");
        }
    }
    //   /**
    //    * Delete a vitals log from the system
    //    */
    //   async removeVitals(id: string): Promise<void> {
    //     await this.getVitalsById(id); // Throws error if record doesn't exist
    //     const success = await vitalsRepository.delete(id);
    //     if (!success) {
    //       throw new Error("Failed to delete vitals record.");
    //     }
    //   }
};
