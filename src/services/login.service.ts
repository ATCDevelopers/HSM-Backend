import bcrypt from 'bcryptjs';
import { findUserByEmail, storeRefreshToken, removeRefreshTokensByUser } from '../repositories/login.repository.js';
import { generateAccessToken, generateRefreshToken } from '../config/auth.config.js';

interface LoginResponse {
  user: {
    id: string;
    firstName: string;
    secondName: string | null;
    lastName: string;
    email: string;
    role: string;
    departmentId: string | null;
  };
  accessToken: string;
  refreshToken: string;
}


const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Soft-deleted accounts must not be allowed to authenticate
  if (user.isDeleted) {
    throw new Error('This account has been deactivated');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Payload structure matches CASL defineAbilityFor(user) signature requirements
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Persist refresh token for server-side rotation and revocation
  await storeRefreshToken(user.id, refreshToken);

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      secondName: user.secondName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    },
    accessToken,
    refreshToken,
  };
};


const logoutUser = async (userId: string): Promise<void> => {
  await removeRefreshTokensByUser(userId);
};

export default { loginUser, logoutUser };