import { db } from "../config/db.js"; // Direct global database import
import { eq } from "drizzle-orm";
import { PrescriptionItemsTable } from "../drizzle/schema.js";

export const prescriptionItemRepository = {
  /**
   * Inserts a new prescription item record into the database.
   * Leverages Drizzle's strict type safety for insert structures.
   */
  async create(data: typeof PrescriptionItemsTable.$inferInsert) {
    const [result] = await db
      .insert(PrescriptionItemsTable)
      .values(data)
      .returning();
    return result;
  },

  /**
   * Finds a single prescription item by its unique ID.
   */
  async findById(id: string) {
    const [result] = await db
      .select()
      .from(PrescriptionItemsTable)
      .where(eq(PrescriptionItemsTable.id, id));
    return result || null;
  },

  /**
   * Retrieves all items linked to a specific parent prescription.
   * Crucial for prescription lookup pipelines.
   */
  async findByPrescriptionId(prescriptionId: string) {
    return await db
      .select()
      .from(PrescriptionItemsTable)
      .where(eq(PrescriptionItemsTable.prescriptionId, prescriptionId));
  },

  /**
   * Retrieves every prescription item present in the system database.
   */
  async findAll() {
    return await db
      .select()
      .from(PrescriptionItemsTable);
  },

  /**
   * Updates an existing prescription item record matching the specific ID.
   */
  async update(id: string, data: Partial<typeof PrescriptionItemsTable.$inferInsert>) {
    const [result] = await db
      .update(PrescriptionItemsTable)
      .set(data)
      .where(eq(PrescriptionItemsTable.id, id))
      .returning();
    return result || null;
  },

  /**
   * Deletes a prescription item row by its ID.
   * Note: Schema handles cascade rules from parent prescriptions.
   */
  async delete(id: string) {
    const [result] = await db
      .delete(PrescriptionItemsTable)
      .where(eq(PrescriptionItemsTable.id, id))
      .returning();
    return result || null;
  }
};
