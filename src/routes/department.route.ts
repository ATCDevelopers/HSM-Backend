import { Router } from "express";
import { departmentController } from "../controllers/department.controller.js";

import { authenticateToken } from '../middleware/auth.middleware.js';
import { adminOnly, checkAbility } from '../middleware/authorization.middleware.js';
import { departmentAccess } from '../middleware/department.middleware.js';

const router = Router();
router.use(authenticateToken);

router.post("/department/",
    checkAbility("write", "Department"),
    departmentController.create
);

router.get("/department/",
    checkAbility("read", "Department"),
    departmentController.getAll
);

// Static /department/staff paths are registered before /department/:id so "staff" is never read as an id.

// Every active staff member with their department, for assigning people to departments
router.get("/department/staff",
    checkAbility("read", "Department"),
    departmentController.getAllStaff
);

// Any signed-in staff member may read their own department, availability and the departments they head
router.get("/department/staff/me",
    departmentController.getMe
);

// Any signed-in staff member may set their own availability
router.patch("/department/staff/me/availability",
    departmentController.setAvailability
);

// Department managers set anyone's availability
router.patch("/department/staff/:userId/availability",
    checkAbility("update", "Department"),
    departmentController.setAvailability
);

// departmentAccess: department managers (Admin, Clinic Manager), or the head of this particular department
router.get("/department/:id",
    departmentAccess("read"),
    departmentController.getById
);

// Heads may edit their own department's name, code and location (not its parent or its head)
router.put("/department/:id",
    departmentAccess("update"),
    departmentController.update
);

router.delete("/department/:id",
    checkAbility("delete", "Department"),
    departmentController.delete
);

router.get("/department/:id/tree",
    checkAbility("read", "Department"),
    departmentController.getTree
);

// Appointing or clearing the head of a department is reserved for admins
router.put("/department/:id/head",
    adminOnly,
    departmentController.setHead
);

router.get("/department/:id/members",
    departmentAccess("read"),
    departmentController.getMembers
);

// Set availability of someone in this department (managers, or the head for their own team)
router.patch("/department/:id/members/:userId/availability",
    departmentAccess("update"),
    departmentController.setMemberAvailability
);

// Assign an unassigned person, or transfer someone in from another department (managers only, not heads)
router.put("/department/:id/members/:userId",
    checkAbility("update", "Department"),
    departmentController.assignStaff
);

// Remove from the department; the person becomes unassigned (managers only, not heads)
router.delete("/department/:id/members/:userId",
    checkAbility("update", "Department"),
    departmentController.removeStaff
);

export default router;
