import express from "express";
import { register, registerWorker, getUsers, getUserByIdController, updateUserController, deleteUserController } from "../controllers/user.controller.js";
import { handleRefreshToken } from "../controllers/token.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { adminOnly, checkAbility } from "../middleware/authorization.middleware.js";

const route = express.Router();

//Admin registration
route.post('/auth/register', register);

//Form for user (roles) administaration
route.post('/auth/register-worker', authenticateToken, adminOnly, registerWorker);

// Refresh Access Token using Refresh Token
route.post('/auth/refresh-token', handleRefreshToken);
route.post('/auth/refresh', handleRefreshToken);

//Getting all user from the user table
route.get('/users', authenticateToken, checkAbility('read', 'User'), getUsers);

//Getting  user by Id from the user table
route.get('/users/:id', authenticateToken, checkAbility('read', 'User'), getUserByIdController);

//Updating  user by Id from the user table

//Here ucan search here an
route.get('/users/:id', authenticateToken, checkAbility('read', 'User'), getUserByIdController);


route.put('/users/:id', authenticateToken, checkAbility('update', 'User'), updateUserController);
route.patch('/users/:id', authenticateToken, checkAbility('update', 'User'), updateUserController);

//Deleting  user by Id from the user table
route.delete('/users/:id', authenticateToken, checkAbility('delete', 'User'), deleteUserController);

export default route;



