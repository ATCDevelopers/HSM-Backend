import { Request, Response } from "express";
import { billingService } from "../services/billing.service.js";

/** Maps billing error prefixes to HTTP statuses; the prefix itself is stripped from the message. */
const ERROR_STATUS: Record<string, number> = { INVALID: 400, UNPRICED: 409, NOT_FOUND: 404, CONFIG: 500 };

const fail = (res: Response, error: any): void => {
  const message = String(error?.message ?? "Billing request failed");
  const [code] = message.split(":");
  res.status(ERROR_STATUS[code] ?? 500).json({ success: false, error: message.replace(/^[A-Z_]+:\s*/, "") });
};

const userId = (req: Request) => (req as any).user?.id as string | undefined;

export const billingController = {
  async listServices(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await billingService.listServices(req.query.category as string | undefined) });
    } catch (error) {
      fail(res, error);
    }
  },

  async createService(req: Request, res: Response): Promise<void> {
    try {
      res.status(201).json({ success: true, data: await billingService.createService(req.body, userId(req)) });
    } catch (error) {
      fail(res, error);
    }
  },

  async updateService(req: Request, res: Response): Promise<void> {
    try {
      const { name, price, isActive } = req.body;
      res.status(200).json({ success: true, data: await billingService.updateService(req.params.id as string, { name, price, isActive }, userId(req)) });
    } catch (error) {
      fail(res, error);
    }
  },

  async patientBalance(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await billingService.patientBalance(req.params.patientId as string) });
    } catch (error) {
      fail(res, error);
    }
  },

  async listCharges(req: Request, res: Response): Promise<void> {
    try {
      const { status, patientId, category, payer } = req.query as Record<string, string | undefined>;
      res.status(200).json({ success: true, data: await billingService.listCharges({ status, patientId, category, payer }) });
    } catch (error) {
      fail(res, error);
    }
  },

  async addCharge(req: Request, res: Response): Promise<void> {
    try {
      res.status(201).json({ success: true, data: await billingService.addManualCharge(req.body, userId(req)) });
    } catch (error) {
      fail(res, error);
    }
  },

  async waiveCharge(req: Request, res: Response): Promise<void> {
    try {
      const waived = req.body?.waived !== false;
      res.status(200).json({ success: true, data: await billingService.setChargeWaived(req.params.id as string, waived, userId(req)) });
    } catch (error) {
      fail(res, error);
    }
  },

  async invoiceCharges(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, chargeIds } = req.body;
      res.status(201).json({ success: true, data: await billingService.invoiceCharges(patientId, chargeIds, userId(req)) });
    } catch (error) {
      fail(res, error);
    }
  },
};
