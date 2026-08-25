import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail, getAllUsers, getUserByIdSanitized, updateUser, deleteUser } from '../repositories/user.repository.js';
import { generateAccessToken, generateRefreshToken } from '../config/auth.config.js';
import { saveRefreshToken } from '../repositories/token.repository.js';
import { UserTable } from '../drizzle/schema.js';

export const registerUser = async (userData: {
  firstName: string;
  lastName: string;
  secondName?: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: typeof UserTable.$inferInsert.role;
  departmentId?: string;
  imagePath?: string;
}) => {
  const existingUser = await getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const user = await createUser({
    ...userData,
    secondName: userData.secondName ?? null,
    departmentId: userData.departmentId ?? null,
    imagePath: userData.imagePath ?? null,
    password: hashedPassword,
  });

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token in database (tokens table) for automatic login
  await saveRefreshToken(user.id, refreshToken);

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      secondName: user.secondName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      imagePath: user.imagePath,
    },
    accessToken,
    refreshToken,
  };
};

export const fetchUsers = async () => {
  return await getAllUsers();
};

export const fetchUserById = async (id: string) => {
  const user = await getUserByIdSanitized(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

export const modifyUser = async (
  id: string,
  updateData: {
    firstName?: string;
    secondName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    role?: typeof UserTable.$inferInsert.role;
    departmentId?: string;
    imagePath?: string;
  }
) => {
  const existingUser = await getUserByIdSanitized(id);
  if (!existingUser) {
    throw new Error('User not found');
  }

  if (updateData.email && updateData.email !== existingUser.email) {
    const emailUser = await getUserByEmail(updateData.email);
    if (emailUser && emailUser.id !== id) {
      throw new Error('Email already in use by another user');
    }
  }

  const payload: Partial<typeof UserTable.$inferInsert> = { ...updateData };

  if (updateData.password) {
    payload.password = await bcrypt.hash(updateData.password, 10);
  }

  const updatedUser = await updateUser(id, payload);
  return updatedUser;
};

export const removeUser = async (id: string) => {
  const existingUser = await getUserByIdSanitized(id);
  if (!existingUser) {
    throw new Error('User not found');
  }
  const deleted = await deleteUser(id);
  return deleted;
};




