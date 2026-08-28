import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { getSystemStatus, clearSystemCache } from "../controllers/superAdmin.controller.js";

const router = Router();

// Apply your token parsing/CASL middleware to all routes inside this file
//router.use(authenticateToken as any);

// Supreme management endpoints
router.get("/system-status", getSystemStatus as any);
router.post("/clear-cache", clearSystemCache as any);

export default router;
