/**
 * @file consultation.controller.ts
 * @description Controller handling Express HTTP payloads for consultation CRUD operations.
 * @author [Your Name Here]
 */

import { Request, Response, NextFunction } from "express";
import { consultationService } from "../services/consultation.service.js";

export const consultationController = {
  /**
   * POST /api/consultation
   * Create a new consultation record
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await consultationService.recordConsultation(req.body);
      res.status(201).json({ 
        success: true, 
        message: "Consultation created successfully", 
        data: record 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

/**
   * GET /api/consultation/patient/:patientId/audit?timeframe=today
   * Fetches consultation history dynamically filtered by timeframe parameters
   */
  async getAuditedHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;
      
      // Default safely to full 'history' if query parameter is empty
      const timeframeQuery = (req.query.timeframe as string) || "history";

      if (typeof patientId !== "string") {
        res.status(400).json({ success: false, error: "Invalid Patient ID parameter format." });
        return;
      }

      const records = await consultationService.getConsultationsFiltered(patientId, timeframeQuery);
      
      res.status(200).json({
        success: true,
        timeframe: timeframeQuery,
        count: records.length,
        data: records
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },





















  /**
   * GET /api/consultation/search?name=John
   * Search consultations filtering by the linked patient's name
   */
  async searchByPatientName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const nameQuery = req.query.name;

      // Type guard query parameters to ensure they match single strings
      if (!nameQuery || typeof nameQuery !== "string") {
        res.status(400).json({ 
          success: false, 
          error: "Query parameter 'name' must be a single valid string." 
        });
        return;
      }

      const results = await consultationService.searchConsultationsByName(nameQuery);
      res.status(200).json({ success: true, data: results });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /api/consultation/:id
   * Fetch a single consultation profile by its direct ID string
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (typeof id !== "string") {
        res.status(400).json({ success: false, error: "Invalid ID parameter format." });
        return;
      }

      const record = await consultationService.getConsultationById(id);
      res.status(200).json({ success: true, data: record });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /api/consultation/patient/:patientId
   * Fetch historical records linked directly to a patient ID
   */
  async getByPatientId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;

      if (typeof patientId !== "string") {
        res.status(400).json({ success: false, error: "Invalid Patient ID parameter format." });
        return;
      }

      const history = await consultationService.getConsultationsByPatient(patientId);
      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * PATCH /api/consultation/:id
   * Alter details on a targeted consultation record row
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (typeof id !== "string") {
        res.status(400).json({ success: false, error: "Invalid ID parameter format." });
        return;
      }

      const updated = await consultationService.updateConsultation(id, req.body);
      res.status(200).json({ 
        success: true, 
        message: "Consultation updated successfully", 
        data: updated 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * DELETE /api/consultation/:id
   * Drop a consultation record row out of your dataset completely
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (typeof id !== "string") {
        res.status(400).json({ success: false, error: "Invalid ID parameter format." });
        return;
      }

      await consultationService.removeConsultation(id);
      res.status(200).json({ success: true, message: "Consultation deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
};
