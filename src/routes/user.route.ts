import express from "express";
import { register, registerWorker } from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/authorization.middleware.js";

const route = express.Router();

route.post('/auth/register', register);
route.post('/auth/register-worker', authenticateToken, adminOnly, registerWorker);




export default route;