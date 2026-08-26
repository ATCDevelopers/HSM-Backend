import { Request, Response, NextFunction } from "express";
import { departmentService } from "../services/department.service.js";

interface IdParam {
  id: string;
}

export const departmentController = {
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
      const updated = await departmentService.updateDepartment(req.params.id, req.body);
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
