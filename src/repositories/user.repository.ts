import { db } from '../config/db.js';
import { UserTable } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export const createUser = async (userData: typeof UserTable.$inferInsert) => {
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

export const getUserByIdSanitized = async (id: string) => {
  const result = await db
    .select({
      id: UserTable.id,
      firstName: UserTable.firstName,
      secondName: UserTable.secondName,
      lastName: UserTable.lastName,
      email: UserTable.email,
      phoneNumber: UserTable.phoneNumber,
      role: UserTable.role,
      departmentId: UserTable.departmentId,
      imagePath: UserTable.imagePath,
      createdAt: UserTable.createdAt,
      updatedAt: UserTable.updatedAt,
    })
    .from(UserTable)
    .where(eq(UserTable.id, id));
  return result[0] || null;
};

export const getAllUsers = async () => {

  return await db
    .select({
      id: UserTable.id,
      firstName: UserTable.firstName,
      secondName: UserTable.secondName,
      lastName: UserTable.lastName,
      email: UserTable.email,
      phoneNumber: UserTable.phoneNumber,
      role: UserTable.role,
      departmentId: UserTable.departmentId,
      imagePath: UserTable.imagePath,
      createdAt: UserTable.createdAt,
      updatedAt: UserTable.updatedAt,
    })
    .from(UserTable);
};

export const updateUser = async (id: string, updateData: Partial<typeof UserTable.$inferInsert>) => {
  const result = await db
    .update(UserTable)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(UserTable.id, id))
    .returning({
      id: UserTable.id,
      firstName: UserTable.firstName,
      secondName: UserTable.secondName,
      lastName: UserTable.lastName,
      email: UserTable.email,
      phoneNumber: UserTable.phoneNumber,
      role: UserTable.role,
      departmentId: UserTable.departmentId,
      imagePath: UserTable.imagePath,
      createdAt: UserTable.createdAt,
      updatedAt: UserTable.updatedAt,
    });
  return result[0] || null;
};

export const deleteUser = async (id: string) => {
  const result = await db
    .delete(UserTable)
    .where(eq(UserTable.id, id))
    .returning({ id: UserTable.id });
  return result[0] || null;
};


///////////////////////////////////////////////////////////////

// Tillya
///////////////////////////////////////////////////////////////


export const findUserByPhone = async (phoneNumber: string) => {
  const result = await db
    .select({ id: UserTable.id, phoneNumber: UserTable.phoneNumber })
    .from(UserTable)
    .where(eq(UserTable.phoneNumber, phoneNumber));
  return result[0] || null;
};


// export const saveOtpToken = async (phoneNumber: string, otp: string, expiresAt: Date) => {
//   const result = await db
//     .insert(OtpTable)
//     .values({
//       phoneNumber,
//       otp,
//       expiresAt,
//     })
//     .returning({ id: OtpTable.id, phoneNumber: OtpTable.phoneNumber });
//   return result[0] || null;
// };



