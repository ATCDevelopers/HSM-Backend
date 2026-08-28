import { Request, Response, NextFunction } from "express";
import { labTestService } from "../services/labTest.service.js";

// Type definition for route parameters containing an ID
interface IdParam {
  id: string;
}

/**
 * Handles creating a new lab test catalog item.
 * POST /api/v1/lab-tests
 */
export async function createLabTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const test = await labTestService.createLabTest(req.body);
    res.status(201).json(test);
  } catch (error) {
    next(error);
  }
}

/**
 * Fetches all registered laboratory tests.
 * GET /api/v1/lab-tests
 */
export async function getAllLabTests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tests = await labTestService.getAllLabTests();
    res.status(200).json(tests);
  } catch (error) {
    next(error);
  }
}

/**
 * Fetches a single laboratory test by its UUID ID.
 * GET /api/v1/lab-tests/:id
 */
export async function getLabTestById(req: Request<IdParam>, res: Response, next: NextFunction): Promise<void> {
  try {
    const test = await labTestService.getLabTestById(req.params.id);
    res.status(200).json(test);
  } catch (error) {
    next(error);
  }
}

/**
 * Modifies an existing laboratory test record structure.
 * PUT /api/v1/lab-tests/:id
 */
export async function updateLabTest(req: Request<IdParam>, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await labTestService.updateLabTest(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes a target laboratory test catalog item.
 * DELETE /api/v1/lab-tests/:id
 */
export async function deleteLabTest(req: Request<IdParam>, res: Response, next: NextFunction): Promise<void> {
  try {
    await labTestService.deleteLabTest(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
