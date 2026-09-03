/**
 * @file vitals.controller.ts
 * @description Controller layer handling HTTP requests and responses for patient vitals.
 * @author [Your Name Here]
 */
import { vitalsService } from "../services/vital.service.js";
export const vitalsController = {
    /**
     * POST /vitals
     * Create a new vitals entry
     */
    async create(req, res, next) {
        try {
            const newVitals = await vitalsService.recordVitals(req.body);
            res.status(201).json({
                success: true,
                message: "Vitals recorded successfully",
                data: newVitals,
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },
    /**
     * GET /vitals/:id
     * Get a vitals entry by its unique UUID
     */
    /**
    * GET /vitals/:id
    * Get a vitals entry by its unique UUID
    */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            // Type guard to ensure id is a valid string
            if (typeof id !== "string") {
                res.status(400).json({ success: false, error: "Invalid ID parameter format." });
                return;
            }
            const vitals = await vitalsService.getVitalsById(id);
            res.status(200).json({
                success: true,
                data: vitals,
            });
        }
        catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    },
    /**
     * GET /vitals/patient/:patientId
     * Fetch all vitals history for a specific patient ID
     */
    async getByPatientId(req, res, next) {
        try {
            const { patientId } = req.params;
            // Type guard to ensure patientId is a valid string
            if (typeof patientId !== "string") {
                res.status(400).json({ success: false, error: "Invalid Patient ID parameter format." });
                return;
            }
            const history = await vitalsService.getVitalsByPatientId(patientId);
            res.status(200).json({
                success: true,
                data: history,
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },
    /**
     * GET /vitals/search?name=john
     * Search vitals using a patient's name query parameter
     */
    async searchByPatientName(req, res, next) {
        try {
            const nameQuery = req.query.name;
            const results = await vitalsService.searchVitalsByPatientName(nameQuery);
            res.status(200).json({
                success: true,
                data: results,
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },
    /**
     * GET /api/vitals/patient/:patientId/audit?timeframe=today
     * Dynamically filters patient clinical metrics by specific time slots.
     */
    async getAuditedVitals(req, res, next) {
        try {
            const { patientId } = req.params;
            // Fallback cleanly to broad 'history' scope if query choice is empty
            const timeframeQuery = req.query.timeframe || "history";
            // Type guard url parameters to prevent compile mismatches
            if (typeof patientId !== "string") {
                res.status(400).json({ success: false, error: "Invalid Patient ID tracking parameter." });
                return;
            }
            const records = await vitalsService.getVitalsHistoryFiltered(patientId, timeframeQuery);
            res.status(200).json({
                success: true,
                timeframe: timeframeQuery,
                count: records.length,
                data: records
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },
    /**
     * PATCH /vitals/:id
     * Update selective fields on a vitals entry
     */
    /**
   * PATCH /vitals/:id
   * Update selective fields on a vitals entry
   */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            // Type guard to ensure id is a valid string
            if (typeof id !== "string") {
                res.status(400).json({ success: false, error: "Invalid ID parameter format." });
                return;
            }
            const updatedVitals = await vitalsService.updateVitals(id, req.body);
            res.status(200).json({
                success: true,
                message: "Vitals updated successfully",
                data: updatedVitals,
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },
    /**
       * DELETE /api/vitals/:id
       * Compliant Soft-Delete: Flags the record as disabled rather than dropping the row
       */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            if (typeof id !== "string") {
                res.status(400).json({ success: false, error: "Invalid ID parameter format." });
                return;
            }
            await vitalsService.removeVitals(id);
            res.status(200).json({
                success: true,
                message: "Vitals record soft-deleted successfully",
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },
    /**
     * POST /api/vitals/:id/restore
     * Administrative Compliance Recovery: Restores a soft-deleted vitals log profile
     */
    async restore(req, res, next) {
        try {
            const { id } = req.params;
            if (typeof id !== "string") {
                res.status(400).json({ success: false, error: "Invalid ID parameter format." });
                return;
            }
            await vitalsService.restoreVitals(id);
            res.status(200).json({
                success: true,
                message: "Vitals log successfully restored for auditing compliance.",
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
    //   /**
    //    * DELETE /vitals/:id
    //    * Remove a vitals log completely
    //    */
    //   async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     try {
    //       const { id } = req.params;
    //       // Type guard to ensure id is a valid string
    //       if (typeof id !== "string") {
    //         res.status(400).json({ success: false, error: "Invalid ID parameter format." });
    //         return;
    //       }
    //       await vitalsService.removeVitals(id);
    //       res.status(200).json({
    //         success: true,
    //         message: "Vitals record deleted successfully",
    //       });
    //     } catch (error: any) {
    //       res.status(400).json({ success: false, error: error.message });
    //     }
    //   }
};
