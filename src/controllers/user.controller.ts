import { Request, Response } from 'express';
import { registerUser, fetchUsers, fetchUserById, modifyUser, removeUser } from '../services/user.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, secondName, lastName, email, phoneNumber, password, role, departmentId, imagePath } = req.body;

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
      departmentId,
      imagePath,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'User registered successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const registerWorker = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { firstName, secondName, lastName, email, phoneNumber, password, role, departmentId, imagePath } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !password || !role) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (!['Doctor', 'Nurse', 'Receptionist', 'Admin', 'Pharmacist', 'LabTechnician', 'Cashier', 'ClinicManager', 'Accountant'].includes(role)) {
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
      departmentId,
      imagePath,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Worker registered successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await fetchUsers();
    res.status(200).json({
      message: 'Users retrieved successfully',
      data: users
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
};

export const getUserByIdController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    const user = await fetchUserById(id);
    res.status(200).json({
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
};

export const updateUserController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const { firstName, secondName, lastName, email, phoneNumber, password, role, departmentId, imagePath } = req.body;

    const updatedUser = await modifyUser(id, {
      firstName,
      secondName,
      lastName,
      email,
      phoneNumber,
      password,
      role,
      departmentId,
      imagePath,
    });

    res.status(200).json({
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (error.message === 'Email already in use by another user') {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
};

export const deleteUserController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    await removeUser(id);

    res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
};




import { Request, Response } from 'express';
import { registerUser, fetchUsers, fetchUserById, modifyUser, removeUser } from '../services/user.js';
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
    console.error('Registration error:', error);
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

    if (!['Doctor', 'Nurse', 'Receptionist', 'Admin', 'Pharmacist', 'LabTechnician', 'Cashier', 'ClinicManager', 'Accountant'].includes(role)) {
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


export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await fetchUsers();
    res.status(200).json({
      message: 'Users retrieved successfully',
      data: users
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
};

export const getUserByIdController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    const user = await fetchUserById(id);
    res.status(200).json({
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
};

export const updateUserController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const { firstName, secondName, lastName, email, phoneNumber, password, role, departmentId, imagePath } = req.body;

    const updatedUser = await modifyUser(id, {
      firstName,
      secondName,
      lastName,
      email,
      phoneNumber,
      password,
      role,
      departmentId,
      imagePath,
    });

    res.status(200).json({
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (error.message === 'Email already in use by another user') {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
};

export const deleteUserController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    await removeUser(id);

    res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
};

