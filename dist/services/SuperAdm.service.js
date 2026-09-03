// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { authRepository } from "../repositories/auth.repository.js";
// import { SUPER_ADMIN_CONFIG } from "../config/superAdmin.config.js"; // Import Special Config
// export const tokenBlacklist = new Set<string>();
// export const authService = {
//   async loginUser(email: string, passwordInput: string) {
//     const cleanEmail = email.trim().toLowerCase();
//     // 1. 👑 SPECIAL BYPASS: Use the hardcoded config file helper checks
//     if (SUPER_ADMIN_CONFIG.verifyCredentials(cleanEmail, passwordInput)) {
//       return SUPER_ADMIN_CONFIG.generateAuthTokens(); // Instantly returns supreme session token payload
//     }
//     // 2. 👥 STANDARD FLOW: Fall back to normal database staff checks
//     const user = await authRepository.findUserByEmail(cleanEmail);
//     if (!user) {
//       throw new Error("Invalid email or password configuration profiles");
//     }
//     const isPasswordValid = await bcrypt.compare(passwordInput, user.password);
//     if (!isPasswordValid) {
//       throw new Error("Invalid email or password configuration profiles");
//     }
//     const tokenPayload = { id: user.id, email: user.email, role: user.role };
//     const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: "1d" });
//     const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_TOKEN!, { expiresIn: "7d" });
//     return {
//       user: {
//         id: user.id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         role: user.role,
//         departmentId: user.departmentId
//       },
//       accessToken,
//       refreshToken
//     };
//   },
//   async logoutUser(token: string) {
//     tokenBlacklist.add(token);
//     return true;
//   }
// };
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRepository } from "../repositories/auth.repository.js";
import { SUPER_ADMIN_CONFIG } from "../config/superAdmin.config.js";
export const tokenBlacklist = new Set();
export const authService = {
    async loginUser(email, passwordInput) {
        const cleanEmail = email.trim().toLowerCase();
        // 1. 👑 RUNTIME INTERCEPT: Check process.env directly to bypass startup timing issues
        const envAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
        const envAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
        console.log("--> Intercept variables resolved:", { envAdminEmail, envAdminPassword });
        // Ensure our env variables actually exist before running the comparison
        if (envAdminEmail && envAdminPassword) {
            if (cleanEmail === envAdminEmail && passwordInput === envAdminPassword) {
                // Intercepted successfully! Generate tokens directly without hitting the DB
                return SUPER_ADMIN_CONFIG.generateAuthTokens();
            }
        }
        // 2. 👥 STANDARD FLOW: Fall back to normal database staff checks
        // The code below will ONLY run if the inputs do NOT match the Super Admin env values
        const user = await authRepository.findUserByEmail(cleanEmail);
        if (!user) {
            throw new Error("Invalid email or password configuration profiles");
        }
        const isPasswordValid = await bcrypt.compare(passwordInput, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid email or password configuration profiles");
        }
        const tokenPayload = { id: user.id, email: user.email, role: user.role };
        const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1d" });
        const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_TOKEN, { expiresIn: "7d" });
        return {
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                departmentId: user.departmentId
            },
            accessToken,
            refreshToken
        };
    },
    async logoutUser(token) {
        tokenBlacklist.add(token);
        return true;
    }
};
