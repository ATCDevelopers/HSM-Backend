import { db } from "../config/db.js"; // Direct global database import
import { and, asc, eq, isNull } from "drizzle-orm";
import { Department, UserTable } from "../drizzle/schema.js";

// Staff fields shown on department screens: no password, no audit columns
const staffColumns = {
  id: UserTable.id,
  firstName: UserTable.firstName,
  secondName: UserTable.secondName,
  lastName: UserTable.lastName,
  email: UserTable.email,
  phoneNumber: UserTable.phoneNumber,
  role: UserTable.role,
  departmentId: UserTable.departmentId,
  availability: UserTable.availability,
  availabilityUpdatedAt: UserTable.availabilityUpdatedAt,
  imagePath: UserTable.imagePath,
};

export const departmentRepository = {
  async create(data: typeof Department.$inferInsert) {
    const [result] = await db.insert(Department).values(data).returning();
    return result;
  },

  async findById(id: string) {
    const [result] = await db.select().from(Department).where(eq(Department.id, id));
    return result || null;
  },

  async findAll() {
    return await db.select().from(Department);
  },

  async findSubDepartments(parentId: string) {
    return await db.select().from(Department).where(eq(Department.parentDepartmentId, parentId));
  },

  /** Active staff in a department. */
  async findMembers(departmentId: string) {
    return await db
      .select(staffColumns)
      .from(UserTable)
      .where(and(eq(UserTable.departmentId, departmentId), isNull(UserTable.deletedAt), eq(UserTable.isDeleted, false)))
      .orderBy(asc(UserTable.role), asc(UserTable.firstName));
  },

  /** Every active staff member with their department (null when unassigned), for the "add staff" picker. */
  async findAllStaff() {
    return await db
      .select({ ...staffColumns, departmentName: Department.name })
      .from(UserTable)
      .leftJoin(Department, eq(UserTable.departmentId, Department.id))
      .where(and(isNull(UserTable.deletedAt), eq(UserTable.isDeleted, false)))
      .orderBy(asc(UserTable.firstName));
  },

  async findStaffById(userId: string) {
    const [row] = await db.select(staffColumns).from(UserTable).where(and(eq(UserTable.id, userId), isNull(UserTable.deletedAt)));
    return row || null;
  },

  async setStaffDepartment(userId: string, departmentId: string | null, updatedBy?: string) {
    const [row] = await db
      .update(UserTable)
      .set({ departmentId, updatedBy: updatedBy ?? null })
      .where(eq(UserTable.id, userId))
      .returning(staffColumns);
    return row || null;
  },

  async setStaffAvailability(userId: string, availability: string, updatedBy?: string) {
    const [row] = await db
      .update(UserTable)
      .set({ availability, availabilityUpdatedAt: new Date(), updatedBy: updatedBy ?? null })
      .where(eq(UserTable.id, userId))
      .returning(staffColumns);
    return row || null;
  },

  async findHeadedBy(userId: string) {
    return await db.select({ id: Department.id, name: Department.name, code: Department.code }).from(Department).where(eq(Department.headUserId, userId));
  },

  async setHead(id: string, headUserId: string | null, updatedBy?: string) {
    const [result] = await db.update(Department).set({ headUserId, updatedBy: updatedBy ?? null }).where(eq(Department.id, id)).returning();
    return result || null;
  },

  /** Clears the head of a department when that person leaves it. */
  async clearHeadIf(departmentId: string, userId: string) {
    await db.update(Department).set({ headUserId: null }).where(and(eq(Department.id, departmentId), eq(Department.headUserId, userId)));
  },

  async update(id: string, data: Partial<typeof Department.$inferInsert>) {
    const [result] = await db.update(Department).set(data).where(eq(Department.id, id)).returning();
    return result || null;
  },

  async delete(id: string) {
    const [result] = await db.delete(Department).where(eq(Department.id, id)).returning();
    return result || null;
  }
};
