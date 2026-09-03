import { departmentService } from "../services/department.service.js";
export const departmentController = {
    async create(req, res, next) {
        try {
            const dept = await departmentService.createDepartment(req.body);
            res.status(201).json(dept);
        }
        catch (error) {
            next(error);
        }
    },
    async getById(req, res, next) {
        try {
            const dept = await departmentService.getDepartmentById(req.params.id);
            res.status(200).json(dept);
        }
        catch (error) {
            next(error);
        }
    },
    async getAll(req, res, next) {
        try {
            const depts = await departmentService.getAllDepartments();
            res.status(200).json(depts);
        }
        catch (error) {
            next(error);
        }
    },
    async getTree(req, res, next) {
        try {
            const tree = await departmentService.getDepartmentTree(req.params.id);
            res.status(200).json(tree);
        }
        catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            const updated = await departmentService.updateDepartment(req.params.id, req.body);
            res.status(200).json(updated);
        }
        catch (error) {
            next(error);
        }
    },
    async delete(req, res, next) {
        try {
            await departmentService.deleteDepartment(req.params.id);
            res.status(204).end();
        }
        catch (error) {
            next(error);
        }
    }
};
