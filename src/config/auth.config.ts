import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET! || 'my-secret-key-change-in-production';

export const generateToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};


