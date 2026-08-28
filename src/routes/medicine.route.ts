
import { Router } from "express";
import {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  searchMedicines,
  updateMedicine,
  deleteMedicine,
} from "../controllers/medicine.controller.js"; // Import the explicit independent functions

import { authenticateToken } from '../middleware/auth.middleware.js';
import { checkAbility } from '../middleware/authorization.middleware.js';

const router = Router();
router.use(authenticateToken);
// Collection actions
router.post("/medicine/", createMedicine);
router.get("/medicine/", getAllMedicines);

// Filtering / Lookup operations (placed above /:id to prevent routing collisions)
router.get("/medicine/search", searchMedicines);

// Granular resource instances
router.get("/medicine/:id", getMedicineById);
router.put("/medicine/:id", updateMedicine);
router.delete("/medicine/:id", deleteMedicine);

export default router;
