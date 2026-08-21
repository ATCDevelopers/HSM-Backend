import { Router } from "express";
import { registerPatientController } from "../controllers/patient.controller.js";
const router = Router();
import * as patientController from "../controllers/patient.controller.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadDocument, getPatientDocuments } from "../controllers/patient.controller.js"; // Hakikisha path ni sahihi
import { softDeletePatient, searchPatients } from "../controllers/patient.controller.js"; 

import {  Request, Response, NextFunction } from "express";
import { checkAbility } from "../middleware/authorization.middleware.js";
import { authenticateToken } from '../middleware/auth.middleware.js';


//u can comment if want to test
router.use(authenticateToken);



router.post("/patient", 
  registerPatientController,
// checkAbility("post", "vital")
 );


 // GET /api/patients
router.get("/patients",
   patientController.getPatients, 
//  checkAbility("get", "patient")
);



// GET /api/patients/:id
router.get("/patient/:id", 
  patientController.getPatientById,
//  checkAbility("get", "patient")
);


// PUT /api/patients/:id
router.put("/patient/:id", 
  patientController.updatePatient,
 // checkAbility("put", "patient")
);



router.get("/:id/pdf", 
  patientController.generateReport,
//  checkAbility("get", "patient")
);




//*******PLEASE  READ THIS BEFORE ANY USAGE BY TILLYA **********/
// 










// 1. Ensure the 'uploads/documents' directory exists on the server disk
const uploadDir = "./uploads/documents";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Multer Storage: Appends unique timestamp suffixes to prevent file overwrites
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// 3. File Filter: Restricts uploads strictly to scanned JPG, PNG, and PDF document formats
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed! Please upload only JPG, PNG, or PDF format."), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Strict file size boundary: Maximum 5MB limit
});

// 4. Wrapper Middleware: Catches and explicitly blocks files that breach the 5MB file-size threshold
const uploadWithGuard = (req: Request, res: Response, next: NextFunction) => {
  upload.single("document")(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File upload blocked! The file exceeds the maximum allowed limit of 5MB."
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

/**
 * @route   POST /api/patients/:id/documents
 * @desc    Uploads a new scanned document or photo for a specific patient
 */
router.post("/:id/documents", uploadWithGuard, uploadDocument);

/**
 * @route   GET /api/patients/:id/documents
 * @desc    Retrieves a historical metadata list of all documents belonging to the patient
 */
router.get("/:id/documents", getPatientDocuments);



//////////// end points ///////////////




/**
 * @route   GET /api/patients/search
 * @desc    Delete All not adviced (It doe not delee)
 * @access  Public/Private
 */
//router.get("/search", searchPatients);

/**
 * @route   PUT /api/patients/:id/deactivate
 * @desc    Inalemaza akaunti ya mgonjwa mmoja (Soft Delete) kwa kutumia ID yake
 * @access  Private (Admin/Staff only)
 */
//router.put("/:id/deactivate", softDeletePatient);





















export default router;










