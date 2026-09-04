import { Request, Response } from 'express';
import { registerPatient  } from "../services/patient.service.js";
import * as patientService from "../services/patient.service.js";
import { documentServiceInstance } from "../services/patient.service.js"; 
import "multer";
import { patientServiceInstance } from "../services/patient.service.js";

export const registerPatientController = async (
  req: Request,
  res: Response
) => {
  try {
    const patient = await registerPatient(req.body);

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Patient registration error:", error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to register patient",
    });
  }
};





// 1. Controller to handle fetching all patients
export const getPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const patients = await patientService.getAllPatientsWithAddress();

    res.status(200).json({
      success: true,
      data: patients,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 2. Controller for Patient fetch by id
export const getPatientById = async (req: Request, res: Response): Promise<void> => {
  try {

    const id = String(req.params.id);
    const patient = await patientService.getPatientWithAddressById(id);



    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error: any) {
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
export const updatePatient = async (req: Request, res: Response): Promise<void> => {
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


    const updatedPatient = await patientService.updatePatientAndAddress(
      patientId,
      patientData || {},
      addressData || {}
    );

    res.status(200).json({
      success: true,
      message: "Updated Successfully",
      data: updatedPatient,
    });
  } catch (error: any) {

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

export const generateReport = async (req: Request, res: Response): Promise<void> => {
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
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="patient_profile_${patientId}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.status(200).send(pdfBuffer);
  } catch (error: any) {
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
export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    console.error("Document Upload Controller Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error ",
    });
  }
};


export const getPatientDocuments = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    console.error("Fetch Documents Controller Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error ",
    });
  }
};


import { patientServiceInstance2 } from "../services/patient.service.js";

export const softDeletePatient = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
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
export const searchPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const searchTerm = String(req.query.q || "");

    const dataset = await patientServiceInstance2.searchAllPatients(searchTerm);

    res.status(200).json({
      success: true,
      message: "Search query executed successfully",
      data: dataset,
    });
  } catch (error: any) {
    console.error("Patient Search Failure:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error during search execution",
    });
  }
};


//////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////
//
// import { Request, Response } from "express";
// import { PatientService } from "./patient.service";





import { PatientServiceSoftDelete } from "../services/patient.service.js";

/**
 * HTTP DELETE handler to flag a patient profile as soft-deleted
 * URL: DELETE /api/patients/:id
 */
export async function deletePatient(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== "string") {
      return res.status(400).json({ success: false, error: "A valid Patient ID string is required." });
    }

    const isDeleted = await PatientServiceSoftDelete.deletePatientProfile(id);
    
    return res.status(200).json({
      success: true,
      message: "Patient profile soft-deleted successfully from active clinical views.",
      data: { id }
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      error: error.message || "An unexpected error occurred during soft deletion."
    });
  }
}

/**
 * HTTP POST handler to restore a soft-deleted patient back to active pool
 * URL: POST /api/patients/:id/recover
 */
export async function recoverPatient(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ success: false, error: "A valid Patient ID string is required." });
    }

    const isRestored = await PatientServiceSoftDelete.restorePatientProfile(id);
    
    return res.status(200).json({
      success: true,
      message: "Patient profile successfully recovered and restored to active pool.",
      data: { id }
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      error: error.message || "An unexpected error occurred during patient recovery."
    });
  }
}
