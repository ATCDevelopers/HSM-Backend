import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { SUPER_ADMIN_CONFIG } from "../config/superAdmin.config.js";

/**
 * Retrieves the core system telemetry status.
 * Access: SuperAdmin Only
 * GET /api/v1/super-admin/system-status
 */
export async function getSystemStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Double-check the user's role metadata explicitly at the controller level
    if (req.user?.role !== "SuperAdmin") {
      res.status(403).json({ error: "Access denied. Supreme Authority required." });
      return;
    }

    res.status(200).json({
      status: "healthy",
      masterId: SUPER_ADMIN_CONFIG.id,
      environment: process.env.NODE_ENV || "development",
      bypassActive: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Simulates clearing the application runtime token blacklist or global cache.
 * Access: SuperAdmin Only
 * POST /api/v1/super-admin/clear-cache
 */
export async function clearSystemCache(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role !== "SuperAdmin") {
      res.status(403).json({ error: "Access denied. Supreme Authority required." });
      return;
    }

    // Process systemic flush operation...
    res.status(200).json({ 
      success: true, 
      message: "Global telemetry memory cache pools successfully flushed by SuperAdmin." 
    });
  } catch (error) {
    next(error);
  }
}
