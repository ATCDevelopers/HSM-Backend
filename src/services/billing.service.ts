import { randomUUID } from "crypto";
import { billingRepository, type BillableServiceInput, type ChargeFilters } from "../repositories/billing.repository.js";
import { statusRepository } from "../repositories/status.repository.js";

/** Appointment types offered at booking; types found on existing appointments are added too. */
const DEFAULT_APPOINTMENT_TYPES = ["Consultation", "Follow-up", "Check-up", "Procedure", "Emergency"];

/** Services that exist regardless of the lab or pharmacy catalogue. */
const FIXED_SERVICES: BillableServiceInput[] = [
  { code: "REGISTRATION", name: "Patient registration (cash account opening)", category: "registration", department: "Reception" },
  { code: "VITALS", name: "Vital signs check", category: "nursing", department: "Nursing" },
];

const multiply = (price: string | null, quantity: number) => (price === null ? null : (Number(price) * quantity).toFixed(2));

/**
 * Re-discovers billable services from lab tests, medicines and appointment types so anything new
 * appears on the price list immediately. Medicines start at their pharmacy price; everything else
 * starts unpriced until billing staff set it.
 */
async function syncCatalog() {
  const { tests, medicines, appointmentTypes } = await billingRepository.discoverySources();
  const types = [...new Set([...DEFAULT_APPOINTMENT_TYPES, ...appointmentTypes])];
  await billingRepository.upsertServices([
    ...FIXED_SERVICES,
    ...types.map((type) => ({ code: `CONSULTATION:${type}`, name: `${type} with doctor`, category: "consultation", department: "Outpatient" })),
    ...tests.map((t) => ({ code: `LAB:${t.id}`, name: t.name, category: "laboratory", department: `Laboratory · ${t.category}` })),
    ...medicines.map((m) => ({
      code: `MED:${m.id}`,
      name: `${m.genericName} ${m.strength} (${m.dosageForm})`,
      category: "pharmacy",
      department: "Pharmacy",
      price: m.price,
    })),
  ]);
}

/** Finds a service by code, running discovery once if it's new (e.g. a lab test created moments ago). */
async function resolveService(code: string) {
  return (await billingRepository.findServiceByCode(code)) ?? (await syncCatalog(), await billingRepository.findServiceByCode(code));
}

/**
 * Records one charge for a billable event. Billing must never block patient care, so failures are
 * logged instead of thrown back into the clinical request that triggered them.
 */
async function recordCharge(event: { code: string; patientId: string; sourceType: string; sourceId: string; quantity?: number; description?: string; userId?: string }) {
  try {
    const [service, patient] = await Promise.all([resolveService(event.code), billingRepository.findPatientPayment(event.patientId)]);
    if (!service || !patient) {
      console.error(`[billing] could not charge ${event.code}: ${!service ? "service" : "patient"} not found`);
      return null;
    }
    if (!service.isActive) return null;
    const quantity = event.quantity ?? 1;
    return await billingRepository.addCharge({
      patientId: event.patientId,
      serviceId: service.id,
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      description: event.description ?? null,
      quantity,
      unitPrice: service.price,
      amount: multiply(service.price, quantity),
      payer: patient.paymentMode,
      createdBy: event.userId ?? null,
    });
  } catch (error) {
    console.error(`[billing] failed to record ${event.code} charge for ${event.sourceType} ${event.sourceId}:`, error);
    return null;
  }
}

// ─── Hooks called by the clinical services ────────────────────────────────────────────────────

/** Only cash patients pay to open an account; NHIF and insured patients register free. */
export const chargeRegistration = (patient: { id: string; paymentMode: string }, userId?: string) =>
  patient.paymentMode === "CASH"
    ? recordCharge({ code: "REGISTRATION", patientId: patient.id, sourceType: "patient", sourceId: patient.id, userId })
    : Promise.resolve(null);

export const chargeAppointment = (appointment: { id: string; patientId: string; appointmentType: string; appointmentDate: Date | string }, userId?: string) =>
  recordCharge({
    code: `CONSULTATION:${appointment.appointmentType}`,
    patientId: appointment.patientId,
    sourceType: "appointment",
    sourceId: appointment.id,
    description: `Appointment on ${new Date(appointment.appointmentDate).toISOString().slice(0, 10)}`,
    userId,
  });

/** A cancelled appointment shouldn't be paid for, unless billing already invoiced it. */
export const waiveAppointment = async (appointmentId: string, userId?: string) => {
  try {
    await billingRepository.waiveUnbilledBySource("appointment", appointmentId, userId);
  } catch (error) {
    console.error(`[billing] failed to waive charges for appointment ${appointmentId}:`, error);
  }
};

export const chargeVitals = (vitals: { id: string; patientId: string }, userId?: string) =>
  recordCharge({ code: "VITALS", patientId: vitals.patientId, sourceType: "vitals", sourceId: vitals.id, userId });

export const chargeLabResult = (result: { id: string; patientId: string; labTestTemplateId: string }, userId?: string) =>
  recordCharge({ code: `LAB:${result.labTestTemplateId}`, patientId: result.patientId, sourceType: "lab_result", sourceId: result.id, userId });

/** Pharmacy is billed per medicine actually dispensed, not when it is prescribed. */
export const chargeDispense = (
  prescription: { id: string; patientId: string },
  lines: { medicineId: string; medicine: string; quantity: number }[],
  userId?: string,
) =>
  Promise.all(
    lines.map((line) =>
      recordCharge({
        code: `MED:${line.medicineId}`,
        patientId: prescription.patientId,
        sourceType: "prescription",
        sourceId: prescription.id,
        quantity: line.quantity,
        description: `Dispensed ${line.quantity} × ${line.medicine}`,
        userId,
      }),
    ),
  );

// ─── Billing department operations ────────────────────────────────────────────────────────────

const generateInvoiceNumber = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `INV-${date}-${Math.floor(1000 + Math.random() * 9000)}`;
};

export const billingService = {
  async listServices(category?: string) {
    await syncCatalog();
    return billingRepository.listServices(category);
  },

  async createService(data: { name: string; category: string; department: string; price?: string | null }, userId?: string) {
    if (!data.name?.trim() || !data.category?.trim() || !data.department?.trim()) {
      throw new Error("INVALID: Name, category and department are required.");
    }
    if (data.price !== undefined && data.price !== null && (isNaN(Number(data.price)) || Number(data.price) < 0)) {
      throw new Error("INVALID: Price must be a number of 0 or more.");
    }
    const code = `CUSTOM:${data.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
    if (await billingRepository.findServiceByCode(code)) throw new Error("INVALID: A service with this name already exists.");
    return billingRepository.createService({ code, name: data.name.trim(), category: data.category.trim().toLowerCase(), department: data.department.trim(), price: data.price ?? null, createdBy: userId });
  },

  async updateService(id: string, data: { name?: string; price?: string | null; isActive?: boolean }, userId?: string) {
    if (data.price !== undefined && data.price !== null && (isNaN(Number(data.price)) || Number(data.price) < 0)) {
      throw new Error("INVALID: Price must be a number of 0 or more.");
    }
    const result = await billingRepository.updateService(
      id,
      { ...data, price: data.price === undefined ? undefined : data.price === null ? null : Number(data.price).toFixed(2) },
      userId,
    );
    if (!result) throw new Error("NOT_FOUND: Service not found.");
    return result;
  },

  listCharges(filters: ChargeFilters) {
    return billingRepository.listCharges(filters);
  },

  /** Billing adds a charge by hand, e.g. for a custom service no clinical action records automatically. */
  async addManualCharge(data: { patientId: string; serviceId: string; quantity?: number; description?: string }, userId?: string) {
    const quantity = Number(data.quantity ?? 1);
    if (!data.patientId || !data.serviceId) throw new Error("INVALID: Choose a patient and a service.");
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error("INVALID: Quantity must be a whole number of 1 or more.");
    const [service, patient] = await Promise.all([billingRepository.findServiceById(data.serviceId), billingRepository.findPatientPayment(data.patientId)]);
    if (!service) throw new Error("NOT_FOUND: Service not found.");
    if (!patient) throw new Error("NOT_FOUND: Patient not found.");
    return billingRepository.addCharge({
      patientId: patient.id,
      serviceId: service.id,
      sourceType: "manual",
      sourceId: randomUUID(),
      description: data.description?.trim() || "Added by billing",
      quantity,
      unitPrice: service.price,
      amount: multiply(service.price, quantity),
      payer: patient.paymentMode,
      createdBy: userId ?? null,
    });
  },

  /**
   * What a patient owes, for the front desk: cash charges not yet invoiced plus unpaid cash invoices.
   * NHIF/insurance charges are reported separately because the patient doesn't pay them at the desk.
   * Partially paid invoices are listed in full because individual payments aren't recorded yet.
   */
  async patientBalance(patientId: string) {
    const [patient, charges, invoices] = await Promise.all([
      billingRepository.findPatientPayment(patientId),
      billingRepository.listCharges({ patientId }),
      billingRepository.invoiceTotalsForPatient(patientId),
    ]);
    if (!patient) throw new Error("NOT_FOUND: Patient not found.");

    const money = (n: number) => n.toFixed(2);
    const live = charges.filter((c) => c.status !== "waived");
    const pendingCash = live.filter((c) => c.status === "unbilled" && c.payer === "CASH");
    const openInvoices = invoices.filter((i) => (i.statusName === "unpaid" || i.statusName === "partially_paid") && !i.insured);
    const pendingTotal = pendingCash.reduce((sum, c) => sum + Number(c.amount ?? 0), 0);
    const invoicedTotal = openInvoices.reduce((sum, i) => sum + Number(i.total), 0);
    const covered = live.filter((c) => c.payer !== "CASH").reduce((sum, c) => sum + Number(c.amount ?? 0), 0);

    return {
      patientId,
      paymentMode: patient.paymentMode,
      amountDue: money(pendingTotal + invoicedTotal),
      notYetInvoiced: money(pendingTotal),
      unpaidInvoices: money(invoicedTotal),
      coveredByInsurance: money(covered),
      // Charges recorded before their service had a price; the amount due grows once billing prices them
      unpricedCount: pendingCash.filter((c) => c.amount === null).length,
      pendingCharges: pendingCash.map((c) => ({ id: c.id, serviceName: c.serviceName, category: c.category, quantity: c.quantity, amount: c.amount, createdAt: c.createdAt })),
      invoices: invoices.map((i) => ({ ...i, total: money(Number(i.total)) })),
    };
  },

  async setChargeWaived(id: string, waived: boolean, userId?: string) {
    const row = await billingRepository.setChargeStatus(id, waived ? "waived" : "unbilled", userId);
    if (!row) throw new Error("INVALID: Only unbilled charges can be waived, and only waived charges restored.");
    return row;
  },

  async invoiceCharges(patientId: string, chargeIds: string[], userId?: string) {
    if (!patientId || !Array.isArray(chargeIds) || chargeIds.length === 0) {
      throw new Error("INVALID: Choose a patient and at least one charge.");
    }
    const unpaid = (await statusRepository.findAll("invoice")).find((s) => s.name === "unpaid");
    if (!unpaid) throw new Error("CONFIG: The 'unpaid' invoice status is missing; run `npm run seed:statuses`.");
    return billingRepository.invoiceCharges({ patientId, chargeIds: [...new Set(chargeIds)], invoiceNumber: generateInvoiceNumber(), statusId: unpaid.id, userId });
  },
};
