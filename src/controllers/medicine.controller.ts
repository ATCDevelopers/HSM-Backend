import { Request, Response, NextFunction } from "express";
import { medicineService } from "../services/medicine.service.js";

// Type definition for route parameters containing an ID
interface IdParam {
  id: string;
}

/**
 * Handles creating a new medicine entry.
 * POST /api/v1/medicines
 */
export async function createMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const medicine = await medicineService.createMedicine(req.body);
    res.status(201).json(medicine);
  } catch (error) {
    next(error);
  }
}

/**
 * Fetches all registered medicines.
 * GET /api/v1/medicines
 */
export async function getAllMedicines(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const medicines = await medicineService.getAllMedicines();
    res.status(200).json(medicines);
  } catch (error) {
    next(error);
  }
}

/**
 * Fetches a single medicine record by its ID.
 * GET /api/v1/medicines/:id
 */
export async function getMedicineById(req: Request<IdParam>, res: Response, next: NextFunction): Promise<void> {
  try {
    const medicine = await medicineService.getMedicineById(req.params.id);
    res.status(200).json(medicine);
  } catch (error) {
    next(error);
  }
}

/**
 * Searches across medicine brand names and generic terms via query parameters.
 * GET /api/v1/medicines/search?q=query_string
 */
export async function searchMedicines(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const searchString = (req.query.q as string) || "";
    const results = await medicineService.searchMedicines(searchString);
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles modifying fields inside a specific medicine record.
 * PUT /api/v1/medicines/:id
 */
export async function updateMedicine(req: Request<IdParam>, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await medicineService.updateMedicine(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes a target medicine entry.
 * DELETE /api/v1/medicines/:id
 */
export async function deleteMedicine(req: Request<IdParam>, res: Response, next: NextFunction): Promise<void> {
  try {
    await medicineService.deleteMedicine(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
