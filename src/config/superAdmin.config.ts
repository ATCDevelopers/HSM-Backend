import jwt from "jsonwebtoken";

export const SUPER_ADMIN_CONFIG = {
  // REMOVED HARDCODED STRINGS: Read strictly from environment variables only
  email: process.env.SUPER_ADMIN_EMAIL,
  password: process.env.SUPER_ADMIN_PASSWORD,
  
  id: "ffffffff-ffff-4fff-bfff-ffffffffffff", 
  firstName: "Supreme",
  lastName: "SuperAdmin",
  role: "SuperAdmin",
  departmentId: null,

  isSuperAdminEmail(email: string): boolean {
    if (!this.email) return false; // Fail safe if environment variable is missing
    return email.trim().toLowerCase() === this.email.toLowerCase();
  },

  verifyCredentials(email: string, passwordInput: string): boolean {
    if (!this.password) return false; // Fail safe if environment variable is missing
    return this.isSuperAdminEmail(email) && passwordInput === this.password;
  },

  generateAuthTokens() {
    const tokenPayload = {
      id: this.id,
      email: this.email,
      role: this.role
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: "1d" });
    const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_TOKEN!, { expiresIn: "7d" });

    return {
      user: {
        id: this.id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        role: this.role,
        departmentId: this.departmentId
      },
      accessToken,
      refreshToken
    };
  }
};
