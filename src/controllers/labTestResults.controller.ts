import { Request, Response, NextFunction } from "express";
import { testResultService } from "../services/labTestResults.service.js"; // Adjust the path as per your directory structure

/**
 * Handles appending a new itemized laboratory evaluation entry for a specific patient.
 * POST /api/v1/test-results
 */
export async function submitTestResult(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    // Safely casting to bypass Express default typing constraints on custom session layers
    const userId = (req as any).user.id;
    const result = await testResultService.createResult(userId, req.body);
    
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetches a single lab test result record loaded with its master form layout structure.
 * GET /api/v1/test-results/:id
 */
export async function fetchTestResultById(
  req: Request<{ id: string }>, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const result = await testResultService.getResultById(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetches every single active lab test result matching a patient's primary UUID parameter.
 * GET /api/v1/test-results/patient/:patientId
 */
export async function fetchPatientTestHistory(
  req: Request<{ patientId: string }>, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const result = await testResultService.queryResultsByPatient(req.params.patientId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles modifying recorded evaluation metrics or clinical notes within a report.
 * PUT /api/v1/test-results/:id
 */
export async function updateTestResult(
  req: Request<{ id: string }>, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const result = await testResultService.modifyResult(req.params.id, userId, req.body);
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Soft-deletes a targeted evaluation record log while tracking the archiving user ID.
 * DELETE /api/v1/test-results/:id
 */
export async function deleteTestResult(
  req: Request<{ id: string }>, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    await testResultService.archiveResult(req.params.id, userId);
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
