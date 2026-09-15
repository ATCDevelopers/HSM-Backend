import { Request, Response, NextFunction } from "express";
import { labTestService } from "../services/labTestConfig.service.js"; // Adjust the path as per your directory structure

/**
 * Handles deploying a new custom lab test layout template.
 * POST /api/v1/lab-tests
 */
export async function createLabTest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    // Safely casting to bypass Express default typing constraints on custom session layers
    const userId = (req as any).user.id;
    const result = await labTestService.createTemplate(userId, req.body);
    
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetches a single custom laboratory configuration template by its primary UUID.
 * GET /api/v1/lab-tests/:id
 */
export async function getLabTestById(
  req: Request<{ id: string }>, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const result = await labTestService.getTemplateById(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetches and filters available lab test layouts matching category or string queries.
 * GET /api/v1/lab-tests
 */
export async function searchLabTests(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    // Forcing casting styles to bypass string | string[] type conflicts safely
    const q = req.query.q as string | undefined;
    const category = req.query.category as string | undefined;

    const result = await labTestService.queryTemplates(q, category);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles modifying structural form paths or data boundaries on active test setups.
 * PUT /api/v1/lab-tests/:id
 */
export async function updateLabTest(
  req: Request<{ id: string }>, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const result = await labTestService.modifyTemplate(req.params.id, userId, req.body);
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Soft-deletes a targeted lab blueprint while tracking the executing user ID.
 * DELETE /api/v1/lab-tests/:id
 */
export async function deleteLabTest(
  req: Request<{ id: string }>, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    await labTestService.archiveTemplate(req.params.id, userId);
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
