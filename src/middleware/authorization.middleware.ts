import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';
import { Actions, Subjects } from '../config/ability.js';

export const adminOnly = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'Admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

export const checkAbility = (action: Actions, subject: Subjects) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.ability) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.ability.cannot(action, subject)) {
      res.status(403).json({ error: `Forbidden: You do not have permission to ${action} ${subject}` });
      return;
    }

    next();
  };
};

