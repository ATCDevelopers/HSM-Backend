import { Response, NextFunction, RequestHandler } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';
import { Actions } from '../config/ability.js';
import { departmentRepository } from '../repositories/department.repository.js';

/**
 * Lets a request through if the user may do `action` on any department (Admin, Clinic Manager),
 * or if they are the head of the department in `:id`. Heads are a per-department attribute rather
 * than a role, so CASL alone can't express this. Sets req.departmentAccess to "manager" or "head"
 * so handlers can narrow what a head may change.
 */
export const departmentAccess = (action: Actions): RequestHandler<any> => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !req.ability) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (req.ability.can(action, 'Department')) {
      (req as any).departmentAccess = 'manager';
      next();
      return;
    }
    const department = await departmentRepository.findById(String(req.params.id));
    if (department && department.headUserId === req.user.id) {
      (req as any).departmentAccess = 'head';
      next();
      return;
    }
    res.status(403).json({ error: 'Forbidden: only department managers or the head of this department can do this' });
  };
};
