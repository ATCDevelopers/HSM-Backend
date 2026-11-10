import express from "express";
import { register, registerWorker, getUsers, getDoctors, getUserByIdController, updateUserController, deleteUserController } from "../controllers/user.controller.js";
import { handleRefreshToken } from "../controllers/token.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { adminOnly, checkAbility } from "../middleware/authorization.middleware.js";

const route = express.Router();

// Admin-only: every role in the schema is a staff role, so open sign-up would let anyone create an Admin
route.post('/auth/register', authenticateToken, adminOnly, register);

//Form for user (roles) administaration
route.post('/auth/register-worker', authenticateToken, adminOnly, registerWorker);

// Refresh Access Token and Refresh Token generating endpoints
route.post('/auth/refresh-token', handleRefreshToken);
route.post('/auth/refresh', handleRefreshToken);

// Doctor directory (ids and names only) for booking and lab "send to doctor" screens; any signed-in staff member may read it
route.get('/doctors', authenticateToken, getDoctors);

//Getting all user from the user table
route.get('/users', authenticateToken, checkAbility('read', 'User'), getUsers);

//Getting  user by Id from the user table
route.get('/users/:id', authenticateToken, checkAbility('read', 'User'), getUserByIdController);

//Updating  user by Id from the user table
route.put('/users/:id', authenticateToken, checkAbility('update', 'User'), updateUserController);
route.patch('/users/:id', authenticateToken, checkAbility('update', 'User'), updateUserController);

//Deleting  user by Id from the user table
route.delete('/users/:id', authenticateToken, checkAbility('delete', 'User'), deleteUserController);

export default route;



