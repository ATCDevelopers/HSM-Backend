import { db } from "../config/db.js";
import { eq } from "drizzle-orm";
import { UserTable } from "../drizzle/schema.js";

export const authRepository = {
  /**
   * Looks up a user account in the database via their email string.
   * Cleans white spaces and forces lowecase formatting to prevent query mismatch bugs.
   */
  async findUserByEmail(email: string) {
    const [user] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email.trim().toLowerCase()));
    return user || null;
  },

  /**
   * Finds a user directly by their UUID.
   * Used for session profile re-validation if needed.
   */
  async findUserById(id: string) {
    const [user] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.id, id));
    return user || null;
  },

  /**
   * Updates tracking properties on the user table during updates or login sequences.
   * e.g., Injecting update logs when password changes or image paths update.
   */
  async updateUserFields(id: string, data: Partial<typeof UserTable.$inferInsert>) {
    const [updatedUser] = await db
      .update(UserTable)
      .set(data)
      .where(eq(UserTable.id, id))
      .returning();
    return updatedUser || null;
  }
};
