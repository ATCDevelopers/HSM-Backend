import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = fs.existsSync(path.resolve(__dirname, '../.env'))
  ? path.resolve(__dirname, '../.env')
  : path.resolve(process.cwd(), '.env');

dotenv.config({ path: envPath });

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_TOKEN = process.env.JWT_REFRESH_TOKEN;

if (!JWT_SECRET) {
  throw new Error('Missing required JWT_SECRET environment variable');
}

if (!JWT_REFRESH_TOKEN) {
  throw new Error('Missing required JWT_REFRESH_TOKEN environment variable');
}

export const generateAccessToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
};

// Keep generateToken as backward-compatible alias
export const generateToken = generateAccessToken;

export const generateRefreshToken = (payload: any): string => {
  return jwt.sign(payload, JWT_REFRESH_TOKEN, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_REFRESH_TOKEN);
  } catch (error) {
    return null;
  }
};



