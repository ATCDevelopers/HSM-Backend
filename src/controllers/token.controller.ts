import { Request, Response } from 'express';
import { rotateRefreshToken } from '../services/token.service.js';

export const handleRefreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];

    if (!refreshToken || typeof refreshToken !== 'string') {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const tokens = await rotateRefreshToken(refreshToken);

    // Set new refresh token in HttpOnly cookie if client uses cookies
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Token refreshed successfully',
      data: tokens,
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Token refresh failed' });
  }
};
