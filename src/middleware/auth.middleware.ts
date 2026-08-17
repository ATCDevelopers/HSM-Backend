import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/auth.config.js';
import { defineAbilityFor, AppAbility } from '../config/ability.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  ability?: AppAbility;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Extract Bearer token

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = decoded;
  req.ability = defineAbilityFor(decoded);
  next();
};
