import { Router } from "express";
import { registerPatientController } from "../controllers/patient.controller.js";
const router = Router();
import * as patientController from "../controllers/patient.controller.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadDocument, getPatientDocuments, streamPatientDocument, deletePatientDocument } from "../controllers/patient.controller.js"; // Hakikisha path ni sahihi
import { softDeletePatient, searchPatients } from "../controllers/patient.controller.js"; 

import {  Request, Response, NextFunction } from "express";
import { checkAbility } from "../middleware/authorization.middleware.js";
import { authenticateToken } from '../middleware/auth.middleware.js';
import { deletePatient, recoverPatient } from "../controllers/patient.controller.js";


router.use(authenticateToken);



router.post("/patient", checkAbility("create", "Patient"), registerPatientController);



router.get("/patients", checkAbility("read", "Patient"), patientController.getPatients);

router.get("/patient/:id", checkAbility("read", "Patient"), patientController.getPatientById);

router.put("/patient/:id", checkAbility("update", "Patient"), patientController.updatePatient);



router.get("/patients/:id/pdf", checkAbility("read", "Patient"), patientController.generateReport);

router.delete("/patients/:id", checkAbility("delete", "Patient"), deletePatient);

router.post("/patients/:id/recover", checkAbility("update", "Patient"), recoverPatient);


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
          message: "File upload blocked! The file exceeds the maximum allowed limit of 10MB."
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};


router.post("/patients/:id/documents", checkAbility("update", "Patient"), uploadWithGuard, uploadDocument);


router.get("/patients/:id/documents", checkAbility("read", "Patient"), getPatientDocuments);

// Inline preview of one document (PDF/image), streamed only to users who may read the patient
router.get("/patients/:id/documents/:documentId/file", checkAbility("read", "Patient"), streamPatientDocument);

router.delete("/patients/:id/documents/:documentId", checkAbility("update", "Patient"), deletePatientDocument);

export default router;










