import { db } from "../config/db.js";
import { eq, desc } from "drizzle-orm";
import { InvoiceItemsTable } from "../drizzle/schema.js";
export const invoiceItemRepository = {
    /**
     * Commits a individual line item charge to an active invoice.
     */
    async create(data) {
        const [result] = await db
            .insert(InvoiceItemsTable)
            .values(data)
            .returning();
        return result;
    },
    /**
     * Finds a single invoice line item by its primary UUID.
     */
    async findById(id) {
        const [result] = await db
            .select()
            .from(InvoiceItemsTable)
            .where(eq(InvoiceItemsTable.id, id));
        return result || null;
    },
    /**
     * Fetches all itemized rows matching a parent invoice container.
     * Crucial for recalculating grand totals.
     */
    async findByInvoiceId(invoiceId) {
        return await db
            .select()
            .from(InvoiceItemsTable)
            .where(eq(InvoiceItemsTable.invoiceId, invoiceId))
            .orderBy(desc(InvoiceItemsTable.createdAt));
    },
    /**
     * Retrieves every individual ledger line item across the facility.
     */
    async findAll() {
        return await db
            .select()
            .from(InvoiceItemsTable);
    },
    /**
     * Modifies columns inside an invoice item line structure.
     */
    async update(id, data) {
        const [result] = await db
            .update(InvoiceItemsTable)
            .set(data)
            .where(eq(InvoiceItemsTable.id, id))
            .returning();
        return result || null;
    },
    /**
     * Deletes a specific line item.
     * (Cascade rules on the parent invoice handle mass deletion automatically).
     */
    async delete(id) {
        const [result] = await db
            .delete(InvoiceItemsTable)
            .where(eq(InvoiceItemsTable.id, id))
            .returning();
        return result || null;
    }
};
