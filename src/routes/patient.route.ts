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
import { deletePatient, recoverPatient } from "../controllers/patient.controller.js";


router.use(authenticateToken);



router.post("/patient", registerPatientController);



router.get("/patients",  patientController.getPatients);

router.get("/patient/:id",  patientController.getPatientById);

router.put("/patient/:id", patientController.updatePatient);



router.get("/:id/pdf", patientController.generateReport);

router.delete("/patients/:id", deletePatient);

router.post("/patients/:id/recover", recoverPatient);


const uploadDir = "./uploads/documents";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});


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
  limits: { fileSize: 10 * 1024 * 1024 } 
});


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


router.post("/:id/documents", uploadWithGuard, uploadDocument);


router.get("/:id/documents", getPatientDocuments);

export default router;










