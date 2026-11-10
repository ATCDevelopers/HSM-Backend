import { Request, Response, NextFunction } from "express";
import { statusService } from "../services/status.service.js";

export async function getStatuses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const statuses = await statusService.getStatuses(req.query.groupType as string | undefined);
    res.status(200).json({ success: true, data: statuses });
  } catch (error) {
    next(error);
  }
}
