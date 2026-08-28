import { Request, Response, NextFunction } from "express";
import { invoiceService } from "../services/invoice.service.js";




/**
 * Handles generating a new billing invoice record.
 * POST /api/v1/invoices
 */
export async function createInvoice(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const invoice = await invoiceService.createInvoice(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    next(error); // Passes Drizzle constraint or naming errors straight to global error middleware
  }
}

/**
 * Fetches all transaction invoices registered in the system ledger.
 * GET /api/v1/invoices
 */
export async function getAllInvoices(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const invoices = await invoiceService.getAllInvoices();
    res.status(200).json(invoices);
  } catch (error) {
    next(error);
  }
}







/**
 * Clean Fix: Pass your param shapes explicitly as the first argument 
 * to Request<RouteParams, ResponseBody, RequestBody, RequestQuery>
 */
export async function getInvoiceById(
  req: Request<{ id: string }>, // Strictly typed parameter inline
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id); // req.params.id is strictly a string
    res.status(200).json(invoice);
  } catch (error) {
    next(error);
  }
}

export async function getInvoicesByPatient(
  req: Request<{ patientId: string }>, // Strictly typed parameter inline
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const invoices = await invoiceService.getInvoicesByPatient(req.params.patientId);
    res.status(200).json(invoices);
  } catch (error) {
    next(error);
  }
}

export async function updateInvoice(
  req: Request<{ id: string }>, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const updated = await invoiceService.updateInvoice(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteInvoice(
  req: Request<{ id: string }>, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    await invoiceService.deleteInvoice(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
