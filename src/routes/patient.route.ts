import { Router } from "express";
import { registerPatientController } from "../controllers/patient.controller.js";
const router = Router();
import * as patientController from "../controllers/patient.controller.js";

router.post("/registerpatient", registerPatientController);

// GET /api/patients
router.get("/listpatients", patientController.getPatients);


// GET /api/patients/:id
router.get("/patient/:id", patientController.getPatientById);

// PUT /api/patients/:id
router.put("/updatepatient/:id", patientController.updatePatient);

export default router;