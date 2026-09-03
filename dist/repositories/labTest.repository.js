import { db } from "../config/db.js"; // Direct global database import
import { eq } from "drizzle-orm";
import { labTests } from "../drizzle/schema.js";
export const labTestRepository = {
    /**
     * Inserts a new laboratory test record into the database.
     * Leverages Drizzle's strict type safety for insert payloads.
     */
    async create(data) {
        const [result] = await db
            .insert(labTests)
            .values(data)
            .returning();
        return result;
    },
    /**
     * Finds a single lab test by its unique UUID primary key.
     */
    async findById(id) {
        const [result] = await db
            .select()
            .from(labTests)
            .where(eq(labTests.id, id));
        return result || null;
    },
    /**
     * Finds a lab test by its unique institutional code string.
     */
    async findByCode(code) {
        const [result] = await db
            .select()
            .from(labTests)
            .where(eq(labTests.code, code));
        return result || null;
    },
    /**
     * Retrieves all laboratory tests from the database.
     */
    async findAll() {
        return await db
            .select()
            .from(labTests);
    },
    /**
     * Updates an existing lab test record matching the specific ID.
     */
    async update(id, data) {
        const [result] = await db
            .update(labTests)
            .set(data)
            .where(eq(labTests.id, id))
            .returning();
        return result || null;
    },
    /**
     * Hard deletes a lab test record from the table matching the target ID.
     */
    async delete(id) {
        const [result] = await db
            .delete(labTests)
            .where(eq(labTests.id, id))
            .returning();
        return result || null;
    }
};
