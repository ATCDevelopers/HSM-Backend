import { departmentRepository } from "../repositories/department.repository.js";
import { Department } from "../drizzle/schema.js";

export const departmentService = {
  async createDepartment(data: typeof Department.$inferInsert) {
    if (data.parentDepartmentId) {
      const parentExists = await departmentRepository.findById(data.parentDepartmentId);
      if (!parentExists) throw new Error(`Parent department does not exist`);
    }
    return departmentRepository.create(data);
  },

  async getDepartmentById(id: string) {
    const dept = await departmentRepository.findById(id);
    if (!dept) throw new Error(`Department with ID ${id} not found`);
    return dept;
  },

  async getAllDepartments() {
    return departmentRepository.findAll();
  },

  async getDepartmentTree(id: string) {
    const department = await this.getDepartmentById(id);
    const subDepartments = await departmentRepository.findSubDepartments(id);
    return { ...department, subDepartments };
  },

  async updateDepartment(id: string, data: Partial<typeof Department.$inferInsert>) {
    await this.getDepartmentById(id);

    if (data.parentDepartmentId === id) {
      throw new Error("A department cannot be configured as its own parent");
    }

    if (data.parentDepartmentId) {
      const parentExists = await departmentRepository.findById(data.parentDepartmentId);
      if (!parentExists) throw new Error(`Parent department does not exist`);
    }

    const updated = await departmentRepository.update(id, data);
    if (!updated) throw new Error("Failed to update department record");
    return updated;
  },

  async deleteDepartment(id: string) {
    await this.getDepartmentById(id);
    const deleted = await departmentRepository.delete(id);
    if (!deleted) throw new Error("Failed to delete department record");
    return deleted;
  }
};
