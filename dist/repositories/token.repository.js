import { db } from '../config/db.js';
import { TokenTable } from '../drizzle/schema.js';
import { eq, lt } from 'drizzle-orm';
export const saveRefreshToken = async (userId, token) => {
    const result = await db.insert(TokenTable).values({
        userId,
        token,
    }).returning();
    return result[0];
};
export const findRefreshToken = async (token) => {
    const result = await db
        .select()
        .from(TokenTable)
        .where(eq(TokenTable.token, token));
    return result[0] || null;
};
export const deleteRefreshToken = async (token) => {
    const result = await db
        .delete(TokenTable)
        .where(eq(TokenTable.token, token))
        .returning();
    return result[0] || null;
};
export const deleteUserRefreshTokens = async (userId) => {
    const result = await db
        .delete(TokenTable)
        .where(eq(TokenTable.userId, userId))
        .returning();
    return result;
};
export const cleanupExpiredTokens = async (cutoffDate) => {
    const result = await db
        .delete(TokenTable)
        .where(lt(TokenTable.createdAt, cutoffDate))
        .returning();
    return result;
};
