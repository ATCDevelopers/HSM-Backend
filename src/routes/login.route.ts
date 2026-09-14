import express from 'express';
import { login, logout } from '../controllers/login.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/auth/login', login);

router.post('/auth/logout', authenticateToken, logout);

export default router;
