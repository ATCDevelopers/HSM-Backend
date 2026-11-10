import { departmentRepository } from "../repositories/department.repository.js";
import { Department } from "../drizzle/schema.js";

export const AVAILABILITY = ["available", "busy", "on_leave", "off_duty"];

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

  async getMembers(id: string) {
    await this.getDepartmentById(id);
    return departmentRepository.findMembers(id);
  },

  async getAllStaff() {
    return departmentRepository.findAllStaff();
  },

  /** Adds a staff member to this department; if they were in another one, this is a transfer. */
  async assignStaff(departmentId: string, userId: string, actorId?: string) {
    await this.getDepartmentById(departmentId);
    const staff = await departmentRepository.findStaffById(userId);
    if (!staff) throw Object.assign(new Error("Staff member not found"), { status: 404 });
    if (staff.departmentId === departmentId) throw Object.assign(new Error("Already in this department"), { status: 409 });
    const updated = await departmentRepository.setStaffDepartment(userId, departmentId, actorId);
    // A head transferred elsewhere no longer heads the department they left.
    if (staff.departmentId) await departmentRepository.clearHeadIf(staff.departmentId, userId);
    return { staff: updated, previousDepartmentId: staff.departmentId };
  },

  /** Leaves the staff member without a department; only valid for someone who is in this one. */
  async removeStaff(departmentId: string, userId: string, actorId?: string) {
    const staff = await departmentRepository.findStaffById(userId);
    if (!staff || staff.departmentId !== departmentId) throw Object.assign(new Error("This person is not in this department"), { status: 404 });
    await departmentRepository.clearHeadIf(departmentId, userId);
    return departmentRepository.setStaffDepartment(userId, null, actorId);
  },

  async getStaff(userId: string) {
    const staff = await departmentRepository.findStaffById(userId);
    if (!staff) throw Object.assign(new Error("Staff member not found"), { status: 404 });
    const [department, headOf] = await Promise.all([
      staff.departmentId ? departmentRepository.findById(staff.departmentId) : null,
      departmentRepository.findHeadedBy(userId),
    ]);
    return { ...staff, departmentName: department?.name ?? null, headOf };
  },

  /** Admin appoints (or clears, with null) the head; the head has to be a member of the department. */
  async setHead(departmentId: string, userId: string | null, actorId?: string) {
    await this.getDepartmentById(departmentId);
    if (userId) {
      const staff = await departmentRepository.findStaffById(userId);
      if (!staff) throw Object.assign(new Error("Staff member not found"), { status: 404 });
      if (staff.departmentId !== departmentId) {
        throw Object.assign(new Error("The head must be a member of this department. Add them to the department first."), { status: 409 });
      }
    }
    return departmentRepository.setHead(departmentId, userId, actorId);
  },

  /** Availability change made from a department page: the person has to belong to that department. */
  async setMemberAvailability(departmentId: string, userId: string, availability: string, actorId?: string) {
    const staff = await departmentRepository.findStaffById(userId);
    if (!staff || staff.departmentId !== departmentId) throw Object.assign(new Error("This person is not in this department"), { status: 404 });
    return this.setAvailability(userId, availability, actorId);
  },

  async setAvailability(userId: string, availability: string, actorId?: string) {
    if (!AVAILABILITY.includes(availability)) {
      throw Object.assign(new Error(`Availability must be one of: ${AVAILABILITY.join(", ")}`), { status: 400 });
    }
    const updated = await departmentRepository.setStaffAvailability(userId, availability, actorId);
    if (!updated) throw Object.assign(new Error("Staff member not found"), { status: 404 });
    return updated;
  },

  /** `asHead` limits a head of department to the department's own details (no parent, no head change). */
  async updateDepartment(id: string, input: Partial<typeof Department.$inferInsert>, asHead = false) {
    await this.getDepartmentById(id);
    // The head is only ever changed through setHead, which checks membership.
    const { headUserId: _ignoredHead, ...data } = input;
    if (asHead) delete data.parentDepartmentId;

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
    // Staff rows reference the department, so it must be emptied first rather than failing on the foreign key.
    const members = await departmentRepository.findMembers(id);
    if (members.length > 0) {
      throw Object.assign(new Error(`This department still has ${members.length} staff member(s). Transfer or remove them first.`), { status: 409 });
    }
    const deleted = await departmentRepository.delete(id);
    if (!deleted) throw new Error("Failed to delete department record");
    return deleted;
  }
};
