/**
 * @file prescriptions.controller.ts
 * @description Controller handling Express HTTP payloads for prescription CRUD operations.
 * @author [Your Name Here]
 */

import { Request, Response, NextFunction } from "express";
import { prescriptionsService } from "../services/perscription.service.js";

export const prescriptionsController = {
  /**
   * POST /api/prescriptions
   * Create a brand new prescription record
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await prescriptionsService.recordPrescription(req.body);
      res.status(201).json({
        success: true,
        message: "Prescription recorded successfully",
        data: record,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /api/prescriptions/search?name=Jane
   * Search prescriptions using a patient's full name query parameter
   */
  async searchByPatientName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const nameQuery = req.query.name;

      // Type guard query parameters to guarantee single string delivery
      if (!nameQuery || typeof nameQuery !== "string") {
        res.status(400).json({ 
          success: false, 
          error: "Query parameter 'name' must be a single valid string." 
        });
        return;
      }

      const results = await prescriptionsService.searchPrescriptionsByPatientName(nameQuery);
      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /api/prescriptions/:id
   * Get an isolated prescription profile by its unique document UUID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (typeof id !== "string") {
        res.status(400).json({ success: false, error: "Invalid prescription ID parameter format." });
        return;
      }

      const record = await prescriptionsService.getPrescriptionById(id);
      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /api/prescriptions/patient/:patientId
   * Fetch all historical prescriptions logged for a targeted patient UUID
   */
  async getByPatientId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;

      if (typeof patientId !== "string") {
        res.status(400).json({ success: false, error: "Invalid Patient ID parameter format." });
        return;
      }

      const history = await prescriptionsService.getPrescriptionsByPatient(patientId);
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * PATCH /api/prescriptions/:id
   * Update selective properties (like notes or status fields) on an existing record
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (typeof id !== "string") {
        res.status(400).json({ success: false, error: "Invalid prescription ID parameter format." });
        return;
      }

      const updatedRecord = await prescriptionsService.updatePrescription(id, req.body);
      res.status(200).json({
        success: true,
        message: "Prescription updated successfully",
        data: updatedRecord,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * DELETE /api/prescriptions/:id
   * Remove a prescription document entirely from the system cluster
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (typeof id !== "string") {
        res.status(400).json({ success: false, error: "Invalid prescription ID parameter format." });
        return;
      }

      await prescriptionsService.removePrescription(id);
      res.status(200).json({
        success: true,
        message: "Prescription record deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
};
