import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserByEmail } from "../repositories/user.repository.js";

// Stateful cache list tracking manual session logouts
export const tokenBlacklist = new Set<string>();

export const authService = {








    
  /**
   * Verifies user credentials and structures the token package matching your CASL requirements.
   */
  async loginUser(email: string, passwordInput: string) {
    // 1. Fetch user by email address
    const user = await getUserByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password configuration profiles");
    }

    // 2. Validate password parameters using bcrypt secure decryption logic
    const isPasswordValid = await bcrypt.compare(passwordInput, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password configuration profiles");
    }

    // 3. Construct payload parameters explicitly matching your CASL defineAbilityFor configuration signature
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role, // 'Admin', 'Doctor', 'Nurse', 'Patient' etc.
    };

    // 4. Generate system access tokens using your config variables
    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_TOKEN!, {
      expiresIn: "7d",
    });

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
      },
      accessToken,
      refreshToken,
    };
  },

  /**
   * Invalidates an active token session instantly.
   */
  async logoutUser(token: string) {
    tokenBlacklist.add(token);
    return true;
  },
};
