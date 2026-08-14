import { db } from '../config/db.js';
import { UserTable } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export const createUser = async (userData: {
  firstName: string;
  secondName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
  
}) => {
  const result = await db.insert(UserTable).values(userData).returning();
  return result[0];
};

export const getUserByEmail = async (email: string) => {
  const result = await db.select().from(UserTable).where(eq(UserTable.email, email));
  return result[0] || null;
};

export const getUserById = async (id: string) => {
  const result = await db.select().from(UserTable).where(eq(UserTable.id, id));
  return result[0] || null;
};
