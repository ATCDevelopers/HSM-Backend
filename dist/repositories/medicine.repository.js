import { db } from "../config/db.js"; // Direct global database import
import { eq, like, or } from "drizzle-orm";
import { MedicinesTable } from "../drizzle/schema.js";
export const medicineRepository = {
    /**
     * Inserts a new medicine record into the database.
     * Leverages Drizzle's strict type safety for insert structures.
     */
    async create(data) {
        const [result] = await db
            .insert(MedicinesTable)
            .values(data)
            .returning();
        return result;
    },
    /**
     * Finds a single medicine by its unique ID.
     */
    async findById(id) {
        const [result] = await db
            .select()
            .from(MedicinesTable)
            .where(eq(MedicinesTable.id, id));
        return result || null;
    },
    /**
     * Retrieves a medicine by its unique code or barcode string.
     */
    async findByCode(code) {
        const [result] = await db
            .select()
            .from(MedicinesTable)
            .where(eq(MedicinesTable.code, code));
        return result || null;
    },
    /**
     * Retrieves all medicines present in the system.
     */
    async findAll() {
        return await db
            .select()
            .from(MedicinesTable);
    },
    /**
     * Basic search functionality across generic name or drug name.
     */
    async search(query) {
        return await db
            .select()
            .from(MedicinesTable)
            .where(or(like(MedicinesTable.genericName, `%${query}%`), like(MedicinesTable.drugName, `%${query}%`)));
    },
    /**
     * Updates an existing medicine record matching the unique ID.
     */
    async update(id, data) {
        const [result] = await db
            .update(MedicinesTable)
            .set(data)
            .where(eq(MedicinesTable.id, id))
            .returning();
        return result || null;
    },
    /**
     * Physically removes a medicine row from the table by ID.
     * If you prefer soft-deletion via your audit logs (...auditLogs),
     * you should use the update method instead to toggle "is_deleted".
     */
    async delete(id) {
        const [result] = await db
            .delete(MedicinesTable)
            .where(eq(MedicinesTable.id, id))
            .returning();
        return result || null;
    }
};
