import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail } from '../repositories/user.repository.js';
import { generateToken } from '../config/auth.config.js';
import { UserTable } from '../drizzle/schema.js';

export const registerUser = async (userData: {
  firstName: string;
  lastName: string;
  secondName?: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: typeof UserTable.$inferInsert.role;
}) => {
  const existingUser = await getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const user = await createUser({
    ...userData,
    secondName: userData.secondName ?? null,
    password: hashedPassword,
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return { user: { id: user.id, email: user.email, role: user.role }, token };
};
