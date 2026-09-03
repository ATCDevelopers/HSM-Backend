import { prescriptionsService } from "../services/perscription.service.js";
export const prescriptionsController = {
    async create(req, res, next) {
        try {
            const record = await prescriptionsService.recordPrescription(req.body);
            res.status(201).json({
                success: true,
                message: "Prescription recorded successfully",
                data: record,
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },
    async searchByPatientName(req, res, next) {
        try {
            const nameQuery = req.query.name;
            // Type guard query parameters to guarantee single string delivery
            if (!nameQuery || typeof nameQuery !== "string") {
                res.status(400).json({
                    success: false,
                    error: "Query parameter 'name' must be a single valid string."
                });
                return;
            }
            const results = await prescriptionsService.searchPrescriptionsByPatientName(nameQuery);
            res.status(200).json({
                success: true,
                data: results,
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            if (typeof id !== "string") {
                res.status(400).json({ success: false, error: "Invalid prescription ID parameter format." });
                return;
            }
            const record = await prescriptionsService.getPrescriptionById(id);
            res.status(200).json({
                success: true,
                data: record,
            });
        }
        catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    },
    async getByPatientId(req, res, next) {
        try {
            const { patientId } = req.params;
            if (typeof patientId !== "string") {
                res.status(400).json({ success: false, error: "Invalid Patient ID parameter format." });
                return;
            }
            const history = await prescriptionsService.getPrescriptionsByPatient(patientId);
            res.status(200).json({
                success: true,
                data: history,
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },
    async update(req, res, next) {
        try {
            const { id } = req.params;
            if (typeof id !== "string") {
                res.status(400).json({ success: false, error: "Invalid prescription ID parameter format." });
                return;
            }
            const updatedRecord = await prescriptionsService.updatePrescription(id, req.body);
            res.status(200).json({
                success: true,
                message: "Prescription updated successfully",
                data: updatedRecord,
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            if (typeof id !== "string") {
                res.status(400).json({ success: false, error: "Invalid prescription ID parameter format." });
                return;
            }
            await prescriptionsService.removePrescription(id);
            res.status(200).json({
                success: true,
                message: "Prescription record deleted successfully",
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
};
