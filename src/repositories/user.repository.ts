import { db } from '../config/db.js';
import { UserTable } from '../drizzle/schema.js';
import { eq, isNull } from 'drizzle-orm';

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
      isDeleted: UserTable.isDeleted,
      deletedAt: UserTable.deletedAt,
      createdAt: UserTable.createdAt,
      updatedAt: UserTable.updatedAt,
    })
    .from(UserTable)
    .where(eq(UserTable.id, id));

  if (!result[0]) return null;
  return {
    ...result[0],
    status: result[0].isDeleted ? "INACTIVE" : "ACTIVE",
  };
};

export const getAllUsers = async (includeDeleted: boolean = false) => {
  const query = db
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
      isDeleted: UserTable.isDeleted,
      deletedAt: UserTable.deletedAt,
      createdAt: UserTable.createdAt,
      updatedAt: UserTable.updatedAt,
    })
    .from(UserTable);

  const result = includeDeleted
    ? await query
    : await query.where(isNull(UserTable.deletedAt));

  return result.map((user) => ({
    ...user,
    status: user.isDeleted ? "INACTIVE" : "ACTIVE",
  }));
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
      isDeleted: UserTable.isDeleted,
      deletedAt: UserTable.deletedAt,
      createdAt: UserTable.createdAt,
      updatedAt: UserTable.updatedAt,
    });

  if (!result[0]) return null;
  return {
    ...result[0],
    status: result[0].isDeleted ? "INACTIVE" : "ACTIVE",
  };
};

export const deleteUser = async (id: string, deletedBy?: string) => {
  const result = await db
    .update(UserTable)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: deletedBy || null,
      updatedAt: new Date(),
    })
    .where(eq(UserTable.id, id))
    .returning({
      id: UserTable.id,
      isDeleted: UserTable.isDeleted,
      deletedAt: UserTable.deletedAt,
    });
  return result[0] || null;
};


export const findUserByPhone = async (phoneNumber: string) => {
  const result = await db
    .select({ id: UserTable.id, phoneNumber: UserTable.phoneNumber })
    .from(UserTable)
    .where(eq(UserTable.phoneNumber, phoneNumber));
  return result[0] || null;
};




