import { db } from '../config/db.js';
import { UserTable, TokenTable } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';


export const findUserByEmail = async (email: string) => {
  const result = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, email));
  return result[0] || null;
};

export const storeRefreshToken = async (userId: string, token: string) => {
  const result = await db
    .insert(TokenTable)
    .values({ userId, token })
    .returning();
  return result[0];
};


export const removeRefreshTokensByUser = async (userId: string) => {
  return await db
    .delete(TokenTable)
    .where(eq(TokenTable.userId, userId))
    .returning();
};