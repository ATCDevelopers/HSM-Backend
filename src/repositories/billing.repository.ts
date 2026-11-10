import { db } from "../config/db.js";
import { and, asc, desc, eq, inArray, isNull, sql, SQL } from "drizzle-orm";
import {
  AppointmentTable,
  BillableServicesTable,
  StatusTable,
  InvoiceItemsTable,
  InvoiceTable,
  labTests,
  MedicinesTable,
  PatientTable,
  ServiceChargesTable,
} from "../drizzle/schema.js";

export type BillableServiceInput = {
  code: string;
  name: string;
  category: string;
  department: string;
  price?: string | null;
};

export type ChargeInput = {
  patientId: string;
  serviceId: string;
  sourceType: string;
  sourceId: string;
  description?: string | null;
  quantity: number;
  unitPrice: string | null;
  amount: string | null;
  payer: "NHIF" | "INSURANCE" | "CASH";
  createdBy?: string | null;
};

export type ChargeFilters = { status?: string; patientId?: string; category?: string; payer?: string };

export const billingRepository = {
  /**
   * Inserts services that don't exist yet and keeps names in step with their source.
   * Prices are never touched here: they belong to billing staff.
   */
  async upsertServices(services: BillableServiceInput[]) {
    if (services.length === 0) return;
    await db
      .insert(BillableServicesTable)
      .values(services)
      .onConflictDoUpdate({ target: BillableServicesTable.code, set: { name: sql`excluded.name` } });
  },

  async findServiceByCode(code: string) {
    const [row] = await db.select().from(BillableServicesTable).where(eq(BillableServicesTable.code, code));
    return row ?? null;
  },

  async findServiceById(id: string) {
    const [row] = await db.select().from(BillableServicesTable).where(eq(BillableServicesTable.id, id));
    return row ?? null;
  },

  async listServices(category?: string) {
    return db
      .select()
      .from(BillableServicesTable)
      .where(and(eq(BillableServicesTable.isDeleted, false), category ? eq(BillableServicesTable.category, category) : undefined))
      .orderBy(asc(BillableServicesTable.category), asc(BillableServicesTable.name));
  },

  async createService(data: BillableServiceInput & { createdBy?: string }) {
    const [row] = await db.insert(BillableServicesTable).values(data).returning();
    return row;
  },

  /**
   * Updates a service. When a price is set, unbilled charges that were recorded while the service had
   * no price pick it up; charges that already had a price keep the one they were made at.
   */
  async updateService(id: string, data: { name?: string; price?: string | null; isActive?: boolean }, userId?: string) {
    return db.transaction(async (tx) => {
      const [service] = await tx
        .update(BillableServicesTable)
        .set({ ...data, updatedBy: userId ?? null })
        .where(eq(BillableServicesTable.id, id))
        .returning();
      if (!service) return null;

      let pricedCharges = 0;
      if (service.price !== null) {
        const priced = await tx
          .update(ServiceChargesTable)
          .set({ unitPrice: service.price, amount: sql`${service.price}::numeric * ${ServiceChargesTable.quantity}`, updatedBy: userId ?? null })
          .where(and(eq(ServiceChargesTable.serviceId, id), eq(ServiceChargesTable.status, "unbilled"), isNull(ServiceChargesTable.unitPrice)))
          .returning({ id: ServiceChargesTable.id });
        pricedCharges = priced.length;
      }
      return { service, pricedCharges };
    });
  },

  /** Sources the price list is discovered from. */
  async discoverySources() {
    const [tests, medicines, appointmentTypes] = await Promise.all([
      db.select({ id: labTests.id, name: labTests.name, category: labTests.category }).from(labTests).where(eq(labTests.isDeleted, false)),
      db
        .select({ id: MedicinesTable.id, genericName: MedicinesTable.genericName, strength: MedicinesTable.strength, dosageForm: MedicinesTable.dosageForm, price: MedicinesTable.price })
        .from(MedicinesTable),
      db.selectDistinct({ type: AppointmentTable.appointmentType }).from(AppointmentTable),
    ]);
    return { tests, medicines, appointmentTypes: appointmentTypes.map((a) => a.type) };
  },

  async findPatientPayment(patientId: string) {
    const [row] = await db
      .select({ id: PatientTable.id, paymentMode: PatientTable.paymentMode })
      .from(PatientTable)
      .where(eq(PatientTable.id, patientId));
    return row ?? null;
  },

  /** Records a charge; a second attempt for the same event and service is ignored. */
  async addCharge(charge: ChargeInput) {
    const [row] = await db.insert(ServiceChargesTable).values(charge).onConflictDoNothing().returning();
    return row ?? null;
  },

  /** Waives charges that haven't been invoiced yet, e.g. when an appointment is cancelled. */
  async waiveUnbilledBySource(sourceType: string, sourceId: string, userId?: string) {
    return db
      .update(ServiceChargesTable)
      .set({ status: "waived", updatedBy: userId ?? null })
      .where(and(eq(ServiceChargesTable.sourceType, sourceType), eq(ServiceChargesTable.sourceId, sourceId), eq(ServiceChargesTable.status, "unbilled")))
      .returning({ id: ServiceChargesTable.id });
  },

  async setChargeStatus(id: string, status: string, userId?: string) {
    const [row] = await db
      .update(ServiceChargesTable)
      .set({ status, updatedBy: userId ?? null })
      .where(and(eq(ServiceChargesTable.id, id), eq(ServiceChargesTable.status, status === "unbilled" ? "waived" : "unbilled")))
      .returning();
    return row ?? null;
  },

  async listCharges(filters: ChargeFilters) {
    const conditions: SQL[] = [eq(ServiceChargesTable.isDeleted, false)];
    if (filters.status) conditions.push(eq(ServiceChargesTable.status, filters.status));
    if (filters.patientId) conditions.push(eq(ServiceChargesTable.patientId, filters.patientId));
    if (filters.category) conditions.push(eq(BillableServicesTable.category, filters.category));
    if (filters.payer) conditions.push(sql`${ServiceChargesTable.payer} = ${filters.payer}`);

    return db
      .select({
        id: ServiceChargesTable.id,
        patientId: ServiceChargesTable.patientId,
        patientFirstName: PatientTable.firstName,
        patientLastName: PatientTable.lastName,
        serviceId: ServiceChargesTable.serviceId,
        serviceName: BillableServicesTable.name,
        category: BillableServicesTable.category,
        department: BillableServicesTable.department,
        sourceType: ServiceChargesTable.sourceType,
        sourceId: ServiceChargesTable.sourceId,
        description: ServiceChargesTable.description,
        quantity: ServiceChargesTable.quantity,
        unitPrice: ServiceChargesTable.unitPrice,
        amount: ServiceChargesTable.amount,
        payer: ServiceChargesTable.payer,
        status: ServiceChargesTable.status,
        invoiceId: ServiceChargesTable.invoiceId,
        createdAt: ServiceChargesTable.createdAt,
      })
      .from(ServiceChargesTable)
      .innerJoin(BillableServicesTable, eq(ServiceChargesTable.serviceId, BillableServicesTable.id))
      .innerJoin(PatientTable, eq(ServiceChargesTable.patientId, PatientTable.id))
      .where(and(...conditions))
      .orderBy(desc(ServiceChargesTable.createdAt));
  },

  /** Every invoice for a patient with its status and line total. */
  async invoiceTotalsForPatient(patientId: string) {
    return db
      .select({
        id: InvoiceTable.id,
        invoiceNumber: InvoiceTable.invoiceNumber,
        statusName: StatusTable.name,
        createdAt: InvoiceTable.createdAt,
        total: sql<string>`coalesce(sum(${InvoiceItemsTable.price}), 0)`,
        // An invoice built from NHIF/insurance charges is a claim, not something the patient pays at the desk.
        // A subquery, not a join, so the item total isn't multiplied by the number of charges.
        insured: sql<boolean>`exists (select 1 from ${ServiceChargesTable} where ${ServiceChargesTable.invoiceId} = ${InvoiceTable.id} and ${ServiceChargesTable.payer} <> 'CASH')`,
      })
      .from(InvoiceTable)
      .leftJoin(StatusTable, eq(InvoiceTable.statusId, StatusTable.id))
      .leftJoin(InvoiceItemsTable, and(eq(InvoiceItemsTable.invoiceId, InvoiceTable.id), eq(InvoiceItemsTable.isDeleted, false)))
      .where(and(eq(InvoiceTable.patientId, patientId), eq(InvoiceTable.isDeleted, false)))
      .groupBy(InvoiceTable.id, StatusTable.name)
      .orderBy(desc(InvoiceTable.createdAt));
  },

  /**
   * Turns a patient's unbilled, priced charges into one invoice (one line per charge) in a transaction.
   * Rows are locked so a charge can't end up on two invoices.
   */
  async invoiceCharges(params: { patientId: string; chargeIds: string[]; invoiceNumber: string; statusId: string; userId?: string }) {
    return db.transaction(async (tx) => {
      const charges = await tx
        .select({
          id: ServiceChargesTable.id,
          patientId: ServiceChargesTable.patientId,
          status: ServiceChargesTable.status,
          amount: ServiceChargesTable.amount,
          quantity: ServiceChargesTable.quantity,
          description: ServiceChargesTable.description,
          serviceName: BillableServicesTable.name,
        })
        .from(ServiceChargesTable)
        .innerJoin(BillableServicesTable, eq(ServiceChargesTable.serviceId, BillableServicesTable.id))
        .where(inArray(ServiceChargesTable.id, params.chargeIds))
        .for("update", { of: ServiceChargesTable });

      if (charges.length !== params.chargeIds.length) throw new Error("NOT_FOUND: One or more charges no longer exist.");
      if (charges.some((c) => c.patientId !== params.patientId)) throw new Error("INVALID: All charges on an invoice must belong to the same patient.");
      if (charges.some((c) => c.status !== "unbilled")) throw new Error("INVALID: Some charges were already invoiced or waived. Refresh and try again.");
      if (charges.some((c) => c.amount === null)) throw new Error("UNPRICED: Some charges have no price yet. Set the service price first.");

      const [invoice] = await tx
        .insert(InvoiceTable)
        .values({ invoiceNumber: params.invoiceNumber, patientId: params.patientId, statusId: params.statusId, createdBy: params.userId ?? null })
        .returning();

      await tx.insert(InvoiceItemsTable).values(
        charges.map((c) => ({
          invoiceId: invoice.id,
          serviceName: c.serviceName,
          description: [c.description, c.quantity > 1 ? `qty ${c.quantity}` : null].filter(Boolean).join(" · ") || null,
          price: c.amount as string,
          createdBy: params.userId ?? null,
        })),
      );

      await tx
        .update(ServiceChargesTable)
        .set({ status: "invoiced", invoiceId: invoice.id, updatedBy: params.userId ?? null })
        .where(inArray(ServiceChargesTable.id, params.chargeIds));

      return invoice;
    });
  },
};
