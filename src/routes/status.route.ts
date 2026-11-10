import { Router } from "express";
import { getStatuses } from "../controllers/status.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// Read-only lookup list (?groupType=medicine|prescription|invoice); any signed-in staff member may read it.
router.get("/statuses", authenticateToken, getStatuses);

export default router;
