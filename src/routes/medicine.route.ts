
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
router.post("/medicine/", checkAbility("create", "Medicine"), createMedicine);
router.get("/medicine/", checkAbility("read", "Medicine"), getAllMedicines);

// Filtering / Lookup operations (placed above /:id to prevent routing collisions)
router.get("/medicine/search", checkAbility("read", "Medicine"), searchMedicines);

// Granular resource instances
router.get("/medicine/:id", checkAbility("read", "Medicine"), getMedicineById);
router.put("/medicine/:id", checkAbility("update", "Medicine"), updateMedicine);
router.delete("/medicine/:id", checkAbility("delete", "Medicine"), deleteMedicine);

export default router;
