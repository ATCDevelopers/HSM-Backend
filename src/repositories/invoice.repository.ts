import { db } from "../config/db.js";
import { eq, desc } from "drizzle-orm";
import { InvoiceTable, UserTable, StatusTable } from "../drizzle/schema.js";

export const invoiceRepository = {
  /**
   * Commits a new invoice record into PostgreSQL.
   */
  async create(data: typeof InvoiceTable.$inferInsert) {
    const [result] = await db.insert(InvoiceTable).values(data).returning();
    return result;
  },

  /**
   * Fetches a single invoice profile alongside its structural relational joins.
   */
  async findById(id: string) {
    const [result] = await db
      .select({
        id: InvoiceTable.id,
        invoiceNumber: InvoiceTable.invoiceNumber,
        patientId: InvoiceTable.patientId,
        patientName: UserTable.firstName, // Joined field from UserTable
        statusId: InvoiceTable.statusId,
        statusName: StatusTable.name,     // Joined field from StatusTable
        createdAt: InvoiceTable.createdAt,
        updatedAt: InvoiceTable.updatedAt
      })
      .from(InvoiceTable)
      .leftJoin(UserTable, eq(InvoiceTable.patientId, UserTable.id))
      .leftJoin(StatusTable, eq(InvoiceTable.statusId, StatusTable.id))
      .where(eq(InvoiceTable.id, id));
    
    return result || null;
  },

  /**
   * Retrieves an invoice matching its human-readable reference number string.
   */
  async findByInvoiceNumber(invoiceNumber: string) {
    const [result] = await db
      .select()
      .from(InvoiceTable)
      .where(eq(InvoiceTable.invoiceNumber, invoiceNumber.trim().toUpperCase()));
    return result || null;
  },

  /**
   * Retrieves all invoices linked to a single patient UUID context.
   */
  async findByPatientId(patientId: string) {
    return await db
      .select()
      .from(InvoiceTable)
      .where(eq(InvoiceTable.patientId, patientId))
      .orderBy(desc(InvoiceTable.createdAt));
  },

  /**
   * Lists every invoice entry in descending order of creation.
   */
  async findAll() {
    return await db
      .select()
      .from(InvoiceTable)
      .orderBy(desc(InvoiceTable.createdAt));
  },

  /**
   * Updates an existing invoice record column matching the unique ID target.
   */
  async update(id: string, data: Partial<typeof InvoiceTable.$inferInsert>) {
    const [result] = await db
      .update(InvoiceTable)
      .set(data)
      .where(eq(InvoiceTable.id, id))
      .returning();
    return result || null;
  },

  /**
   * Deletes an invoice record row. 
   * Note: Constraints enforce a restriction policy if other records rely on it.
   */
  async delete(id: string) {
    const [result] = await db
      .delete(InvoiceTable)
      .where(eq(InvoiceTable.id, id))
      .returning();
    return result || null;
  }
};
