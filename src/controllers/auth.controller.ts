import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.js";

/**
 * Handles processing user login requests.
 * Validates credentials and routes the resulting profile details along with signed tokens.
 * POST /api/v1/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password fields are mandatory" });
      return;
    }

    const sessionData = await authService.loginUser(email, password);
    res.status(200).json(sessionData);
  } catch (error: any) {
    // 401 Unauthorized for bad credentials to protect system endpoint listings
    res.status(401).json({ error: error.message });
  }
}

/**
 * Handles parsing and invalidating an active user session token.
 * POST /api/v1/auth/logout
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1]; // Safely pull string past the 'Bearer' prefix

    if (!token) {
      res.status(400).json({ error: "Missing authorization session parameters" });
      return;
    }

    await authService.logoutUser(token);
    res.status(200).json({ message: "Session signed out successfully" });
  } catch (error) {
    next(error);
  }
}
