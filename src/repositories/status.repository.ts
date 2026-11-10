import { db } from "../config/db.js";
import { and, asc, eq } from "drizzle-orm";
import { StatusTable } from "../drizzle/schema.js";

export const statusRepository = {
  async findAll(groupType?: string) {
    const conditions = [eq(StatusTable.isDeleted, false)];
    if (groupType) {
      conditions.push(eq(StatusTable.groupType, groupType));
    }
    return await db
      .select({ id: StatusTable.id, name: StatusTable.name, groupType: StatusTable.groupType })
      .from(StatusTable)
      .where(and(...conditions))
      .orderBy(asc(StatusTable.groupType), asc(StatusTable.name));
  },

  /** Inserts any missing statuses; existing names are left untouched. */
  async ensure(statuses: { name: string; groupType: string }[]) {
    return await db.insert(StatusTable).values(statuses).onConflictDoNothing({ target: StatusTable.name }).returning();
  }
};
