import { db } from "../config/db.js"; // Direct global database import
import { eq } from "drizzle-orm";
import { Department } from "../drizzle/schema.js";
export const departmentRepository = {
    async create(data) {
        const [result] = await db.insert(Department).values(data).returning();
        return result;
    },
    async findById(id) {
        const [result] = await db.select().from(Department).where(eq(Department.id, id));
        return result || null;
    },
    async findAll() {
        return await db.select().from(Department);
    },
    async findSubDepartments(parentId) {
        return await db.select().from(Department).where(eq(Department.parentDepartmentId, parentId));
    },
    async update(id, data) {
        const [result] = await db.update(Department).set(data).where(eq(Department.id, id)).returning();
        return result || null;
    },
    async delete(id) {
        const [result] = await db.delete(Department).where(eq(Department.id, id)).returning();
        return result || null;
    }
};
