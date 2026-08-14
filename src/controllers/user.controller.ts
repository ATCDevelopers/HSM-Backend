import { Request, Response } from 'express';
import { registerUser } from '../services/user.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, secondName, lastName, email, phoneNumber, password, role } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await registerUser({
      firstName,
      secondName,
      lastName,
      email,
      phoneNumber,
      password,
      role: role || 'Patient',
    });

    res.status(201).json({ 
      message: 'User registered successfully',
      data: result 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const registerWorker = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { firstName, secondName, lastName, email, phoneNumber, password, role } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !password || !role) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (!['Doctor', 'Nurse', 'Receptionist', 'Admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role for worker registration' });
      return;
    }

    const result = await registerUser({
      firstName,
      secondName,
      lastName,
      email,
      phoneNumber,
      password,
      role,
    });

    res.status(201).json({ 
      message: 'Worker registered successfully',
      data: result 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};