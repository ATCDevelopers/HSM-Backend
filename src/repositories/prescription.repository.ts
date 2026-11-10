
import { db } from "../config/db.js"; // Adjust path to your Drizzle db instance
import { PrescriptionsTable, PrescriptionItemsTable, MedicinesTable, PatientTable, UserTable, StatusTable } from "../drizzle/schema.js"; // Adjust schema path
import { eq, desc, or, and, ilike, sql } from "drizzle-orm";

export type NewPrescription = typeof PrescriptionsTable.$inferInsert;
export type Prescription = typeof PrescriptionsTable.$inferSelect;

export const prescriptionsRepository = {
  /**
   * Create a new prescription entry record row
   */
  async create(data: NewPrescription): Promise<Prescription> {
    const [inserted] = await db
      .insert(PrescriptionsTable)
      .values(data)
      .returning();
    return inserted;
  },

  /**
   * Find a specific prescription profile by its unique ID
   * Dynamically joins profiles from PatientTable, UserTable (Doctor), and StatusTable
   */
  async findById(id: string) {
    const [record] = await db
      .select({
        prescription: PrescriptionsTable,
        patient: {
          id: PatientTable.id,
          firstName: PatientTable.firstName,
          lastName: PatientTable.lastName,
        },
        doctor: {
          id: UserTable.id,
          firstName: UserTable.firstName,
          lastName: UserTable.lastName,
        },
        status: {
          id: StatusTable.id,
          name: StatusTable.name, // Adjust column name based on your StatusTable properties
        }
      })
      .from(PrescriptionsTable)
      .innerJoin(PatientTable, eq(PrescriptionsTable.patientId, PatientTable.id))
      .innerJoin(UserTable, eq(PrescriptionsTable.doctorId, UserTable.id))
      .innerJoin(StatusTable, eq(PrescriptionsTable.statusId, StatusTable.id))
      .where(eq(PrescriptionsTable.id, id))
      .limit(1);
    return record;
  },

  /**
   * Fetch all historical prescriptions written for a targeted patient UUID
   */
  async findByPatientId(patientId: string) {
    return db
      .select({
        prescription: PrescriptionsTable,
        doctor: {
          id: UserTable.id,
          firstName: UserTable.firstName,
          lastName: UserTable.lastName,
        },
        status: {
          id: StatusTable.id,
          name: StatusTable.name,
        }
      })
      .from(PrescriptionsTable)
      .innerJoin(UserTable, eq(PrescriptionsTable.doctorId, UserTable.id))
      .innerJoin(StatusTable, eq(PrescriptionsTable.statusId, StatusTable.id))
      .where(eq(PrescriptionsTable.patientId, patientId))
      .orderBy(desc(PrescriptionsTable.createdAt));
  },

  /**
   * Search active prescriptions by filtering against the linked patient's full name.
   * Splits multi-word phrases cleanly (e.g. "Jane Doe") across database text fields.
   */
  async findByPatientName(searchTerm: string) {
    const words = searchTerm.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    const matchConditions = words.map((word) => {
      const wildcardTerm = `%${word}%`;
      return or(
        ilike(PatientTable.firstName, wildcardTerm),
        ilike(PatientTable.middleName, wildcardTerm),
        ilike(PatientTable.lastName, wildcardTerm)
      );
    });

    return db
      .select({
        prescription: PrescriptionsTable,
        patient: {
          id: PatientTable.id,
          firstName: PatientTable.firstName,
          middleName: PatientTable.middleName,
          lastName: PatientTable.lastName,
        },
        doctor: {
          id: UserTable.id,
          firstName: UserTable.firstName,
          lastName: UserTable.lastName,
        },
        status: {
          id: StatusTable.id,
          name: StatusTable.name,
        }
      })
      .from(PrescriptionsTable)
      .innerJoin(PatientTable, eq(PrescriptionsTable.patientId, PatientTable.id))
      .innerJoin(UserTable, eq(PrescriptionsTable.doctorId, UserTable.id))
      .innerJoin(StatusTable, eq(PrescriptionsTable.statusId, StatusTable.id))
      .where(and(...matchConditions))
      .orderBy(desc(PrescriptionsTable.createdAt));
  },

  /**
   * Pharmacy queue: every prescription with patient, doctor and status names, newest first.
   * statusName narrows it (e.g. "pending" for the dispensing queue).
   */
  async findAll(statusName?: string) {
    return db
      .select({
        prescription: PrescriptionsTable,
        patient: {
          id: PatientTable.id,
          firstName: PatientTable.firstName,
          middleName: PatientTable.middleName,
          lastName: PatientTable.lastName,
        },
        doctor: {
          id: UserTable.id,
          firstName: UserTable.firstName,
          lastName: UserTable.lastName,
        },
        status: {
          id: StatusTable.id,
          name: StatusTable.name,
        }
      })
      .from(PrescriptionsTable)
      .innerJoin(PatientTable, eq(PrescriptionsTable.patientId, PatientTable.id))
      .innerJoin(UserTable, eq(PrescriptionsTable.doctorId, UserTable.id))
      .innerJoin(StatusTable, eq(PrescriptionsTable.statusId, StatusTable.id))
      .where(statusName ? eq(StatusTable.name, statusName) : undefined)
      .orderBy(desc(PrescriptionsTable.createdAt));
  },

  /**
   * Dispenses a prescription in one transaction: locks the prescription and every medicine it uses,
   * refuses if it is no longer pending or any medicine is short, then deducts stock and marks it dispensed.
   * Locking means two pharmacists dispensing at once can neither double-dispense nor drive stock negative.
   */
  async dispense(prescriptionId: string, dispensedStatusId: string, userId: string) {
    return db.transaction(async (tx) => {
      const [current] = await tx
        .select({ id: PrescriptionsTable.id, statusName: StatusTable.name })
        .from(PrescriptionsTable)
        .innerJoin(StatusTable, eq(PrescriptionsTable.statusId, StatusTable.id))
        .where(eq(PrescriptionsTable.id, prescriptionId))
        .for("update", { of: PrescriptionsTable });

      if (!current) throw new Error(`NOT_FOUND: Prescription ${prescriptionId} not found.`);
      if (current.statusName !== "pending") {
        throw new Error(`INVALID_STATE: Only pending prescriptions can be dispensed; this one is ${current.statusName}.`);
      }

      const lines = await tx
        .select({
          medicineId: MedicinesTable.id,
          name: MedicinesTable.genericName,
          strength: MedicinesTable.strength,
          stock: MedicinesTable.stock,
          quantity: PrescriptionItemsTable.quantity,
        })
        .from(PrescriptionItemsTable)
        .innerJoin(MedicinesTable, eq(PrescriptionItemsTable.medicineId, MedicinesTable.id))
        .where(eq(PrescriptionItemsTable.prescriptionId, prescriptionId))
        .for("update", { of: MedicinesTable });

      if (lines.length === 0) throw new Error("EMPTY: This prescription has no medicines to dispense.");

      // The same medicine may appear on several lines, so check the combined quantity.
      const needed = new Map<string, { name: string; stock: number; quantity: number }>();
      for (const line of lines) {
        const entry = needed.get(line.medicineId) ?? { name: `${line.name} ${line.strength}`, stock: line.stock, quantity: 0 };
        entry.quantity += line.quantity;
        needed.set(line.medicineId, entry);
      }
      const short = [...needed.values()].filter((m) => m.stock < m.quantity);
      if (short.length > 0) {
        throw new Error(`INSUFFICIENT_STOCK: ${short.map((m) => `${m.name} (need ${m.quantity}, have ${m.stock})`).join("; ")}`);
      }

      const dispensed = [];
      for (const [medicineId, m] of needed) {
        const [updated] = await tx
          .update(MedicinesTable)
          .set({ stock: sql`${MedicinesTable.stock} - ${m.quantity}`, updatedBy: userId })
          .where(eq(MedicinesTable.id, medicineId))
          .returning({ stock: MedicinesTable.stock });
        dispensed.push({ medicineId, medicine: m.name, quantity: m.quantity, remainingStock: updated.stock });
      }

      const [prescription] = await tx
        .update(PrescriptionsTable)
        .set({ statusId: dispensedStatusId, updatedBy: userId })
        .where(eq(PrescriptionsTable.id, prescriptionId))
        .returning();

      return { prescription, dispensed };
    });
  },

  /**
   * Update an existing prescription (e.g. changing notes or altering status references)
   */
  async update(id: string, data: Partial<NewPrescription>): Promise<Prescription | undefined> {
    const [updated] = await db
      .update(PrescriptionsTable)
      .set(data)
      .where(eq(PrescriptionsTable.id, id))
      .returning();
    return updated;
  },

  /**
   * Delete a prescription row from the engine
   */
  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(PrescriptionsTable)
      .where(eq(PrescriptionsTable.id, id))
      .returning({ deletedId: PrescriptionsTable.id });
    return result.length > 0;
  }
};
