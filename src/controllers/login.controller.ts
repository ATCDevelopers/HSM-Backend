import { Request, Response, NextFunction } from 'express';
import loginService from '../services/login.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';


export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password fields are required' });
      return;
    }

    const sessionData = await loginService.loginUser(email, password);

    // Set refresh token as HttpOnly cookie for secure client-side storage
    res.cookie('refreshToken', sessionData.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Login successful',
      data: sessionData,
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};


export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    await loginService.logoutUser(req.user.id);

    // Clear the refresh token cookie on the client side
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    next(error);
  }
};