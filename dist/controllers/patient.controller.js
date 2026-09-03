import { registerPatient } from "../services/patient.service.js";
import * as patientService from "../services/patient.service.js";
import { documentServiceInstance } from "../services/patient.service.js";
import "multer";
import { patientServiceInstance } from "../services/patient.service.js";
export const registerPatientController = async (req, res) => {
    try {
        const patient = await registerPatient(req.body);
        return res.status(201).json({
            success: true,
            message: "Patient registered successfully",
            data: patient,
        });
    }
    catch (error) {
        console.error("Patient registration error:", error);
        return res.status(400).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Failed to register patient",
        });
    }
};
// 1. Controller to handle fetching all patients
export const getPatients = async (req, res) => {
    try {
        const patients = await patientService.getAllPatientsWithAddress();
        res.status(200).json({
            success: true,
            data: patients,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};
// 2. Controller for Patient fetch by id
export const getPatientById = async (req, res) => {
    try {
        const id = String(req.params.id);
        const patient = await patientService.getPatientWithAddressById(id);
        res.status(200).json({
            success: true,
            data: patient,
        });
    }
    catch (error) {
        // If our service threw a "not found" error, return a 404 status
        if (error.message.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};
//Controller for patient Update
export const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patientId = String(id);
        const { patientData, addressData } = req.body;
        if (!patientData && !addressData) {
            res.status(400).json({
                success: false,
                message: "Please Information for Update carefully ",
            });
            return;
        }
        const updatedPatient = await patientService.updatePatientAndAddress(patientId, patientData || {}, addressData || {});
        res.status(200).json({
            success: true,
            message: "Updated Successfully",
            data: updatedPatient,
        });
    }
    catch (error) {
        if (error.message.includes("User not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};
export const generateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const patientId = String(id);
        if (!id) {
            res.status(400).json({
                success: false,
                message: "Patient ID parameter is required",
            });
            return;
        }
        // Call the method directly on the explicitly imported instance
        const pdfBuffer = await patientServiceInstance.generatePatientPdf(patientId);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="patient_profile_${patientId}.pdf"`);
        res.setHeader("Content-Length", pdfBuffer.length);
        res.status(200).send(pdfBuffer);
    }
    catch (error) {
        console.error("PDF Engine Generation Failure:", error);
        if (error.message && error.message.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};
/**
 * HTTP Handler: Inapokea picha zilizoskaniwa (JPG/PNG) au mafile (PDF) na kuhifadhi taarifa zake
 */
export const uploadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const patientId = String(id);
        if (!id) {
            res.status(400).json({
                success: false,
                message: "Patient ID parameter is required",
            });
            return;
        }
        // Multer inaweka data ya faili ndani ya req.file likishapokelewa salama
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "Tafadhali weka hati au picha iliyoskaniwa (No file uploaded)",
            });
            return;
        }
        const formattedSize = `${(req.file.size / 1024).toFixed(1)} KB`;
        const savedDoc = await documentServiceInstance.uploadPatientDocument({
            patientId,
            documentName: req.file.originalname,
            fileUrl: req.file.path,
            mimeType: req.file.mimetype,
            fileSize: formattedSize,
        });
        res.status(201).json({
            success: true,
            message: "Successfully imported",
            data: savedDoc,
        });
    }
    catch (error) {
        console.error("Document Upload Controller Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error ",
        });
    }
};
export const getPatientDocuments = async (req, res) => {
    try {
        const { id } = req.params;
        const patientId = String(id);
        if (!id) {
            res.status(400).json({
                success: false,
                message: "Patient ID parameter is required",
            });
            return;
        }
        const documents = await documentServiceInstance.getPatientDocumentsList(patientId);
        res.status(200).json({
            success: true,
            message: "Patients Documents found",
            data: documents,
        });
    }
    catch (error) {
        console.error("Fetch Documents Controller Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error ",
        });
    }
};
import { patientServiceInstance2 } from "../services/patient.service.js";
export const softDeletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patientId = String(id);
        const currentUserId = req.body.userId || "00000000-0000-0000-0000-000000000000";
        if (!id) {
            res.status(400).json({ success: false, message: "Patient ID parameter is required" });
            return;
        }
        const result = await patientServiceInstance2.deactivatePatient(patientId, currentUserId);
        res.status(200).json({
            success: true,
            message: "Patient profile deactivated successfully from active lists",
            data: result,
        });
    }
    catch (error) {
        console.error("Soft Delete Failure:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error during patient deactivation",
        });
    }
};
/**
 * HTTP GET Handler: Queries patients and returns masked profiles for deactivated users
 */
export const searchPatients = async (req, res) => {
    try {
        const searchTerm = String(req.query.q || "");
        const dataset = await patientServiceInstance2.searchAllPatients(searchTerm);
        res.status(200).json({
            success: true,
            message: "Search query executed successfully",
            data: dataset,
        });
    }
    catch (error) {
        console.error("Patient Search Failure:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error during search execution",
        });
    }
};
