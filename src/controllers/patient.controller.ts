import { Request, Response } from 'express';


import { registerPatient  } from "../services/patient.js";


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


///////////////////////////////////////////////////////////////////







import * as patientService from "../services/patient.js";

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



////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////


//Controller for patient Update 
export const updatePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const patientId = String(id); 

    // 
    // { "patientData": { ... }, "addressData": { ... } }
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

