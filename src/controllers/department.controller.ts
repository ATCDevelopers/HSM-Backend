import { Request, Response, NextFunction } from "express";
import { departmentService } from "../services/department.service.js";

interface IdParam {
  id: string;
}

const actor = (req: Request<any>) => (req as any).user?.id as string | undefined;

export const departmentController = {
  async getMembers(req: Request<IdParam>, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await departmentService.getMembers(req.params.id) });
    } catch (error) {
      next(error);
    }
  },

  async getAllStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await departmentService.getAllStaff() });
    } catch (error) {
      next(error);
    }
  },

  async assignStaff(req: Request<{ id: string; userId: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await departmentService.assignStaff(req.params.id, req.params.userId, actor(req)) });
    } catch (error) {
      next(error);
    }
  },

  async removeStaff(req: Request<{ id: string; userId: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await departmentService.removeStaff(req.params.id, req.params.userId, actor(req)) });
    } catch (error) {
      next(error);
    }
  },

  async setHead(req: Request<IdParam>, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body?.userId ?? null;
      res.status(200).json({ success: true, data: await departmentService.setHead(req.params.id, userId, actor(req)) });
    } catch (error) {
      next(error);
    }
  },

  async setMemberAvailability(req: Request<{ id: string; userId: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await departmentService.setMemberAvailability(req.params.id, req.params.userId, req.body?.availability, actor(req)) });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: await departmentService.getStaff(String(actor(req))) });
    } catch (error) {
      next(error);
    }
  },

  /** Managers set anyone's availability (?userId in the path); staff set their own via /me. */
  async setAvailability(req: Request<{ userId?: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId ?? actor(req);
      res.status(200).json({ success: true, data: await departmentService.setAvailability(String(userId), req.body?.availability, actor(req)) });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await departmentService.createDepartment(req.body);
      res.status(201).json(dept);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request<IdParam>, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await departmentService.getDepartmentById(req.params.id);
      res.status(200).json(dept);
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const depts = await departmentService.getAllDepartments();
      res.status(200).json(depts);
    } catch (error) {
      next(error);
    }
  },

  async getTree(req: Request<IdParam>, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await departmentService.getDepartmentTree(req.params.id);
      res.status(200).json(tree);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request<IdParam>, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await departmentService.updateDepartment(req.params.id, req.body, (req as any).departmentAccess === "head");
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request<IdParam>, res: Response, next: NextFunction): Promise<void> {
    try {
      await departmentService.deleteDepartment(req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
};
