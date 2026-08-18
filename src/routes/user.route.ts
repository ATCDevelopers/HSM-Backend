import express from "express";
import { register, registerWorker, getUsers, getUserByIdController, updateUserController, deleteUserController } from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { adminOnly, checkAbility } from "../middleware/authorization.middleware.js";

const route = express.Router();

//Admin registration
route.post('/auth/register', register);

//Form for user (roles) administaration
route.post('/auth/register-worker', authenticateToken, adminOnly, registerWorker);


//Getting all user from the user table
route.get('/users', authenticateToken, checkAbility('read', 'User'), getUsers);


//Here ucan search here an
route.get('/users/:id', authenticateToken, checkAbility('read', 'User'), getUserByIdController);


route.put('/users/:id', authenticateToken, checkAbility('update', 'User'), updateUserController);
route.patch('/users/:id', authenticateToken, checkAbility('update', 'User'), updateUserController);
route.delete('/users/:id', authenticateToken, checkAbility('delete', 'User'), deleteUserController);

export default route;



