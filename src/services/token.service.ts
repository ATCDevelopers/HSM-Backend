import cron from 'node-cron';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../config/auth.config.js';
import {
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteUserRefreshTokens,
  cleanupExpiredTokens,
} from '../repositories/token.repository.js';

export const rotateRefreshToken = async (oldRefreshToken: string) => {
  if (!oldRefreshToken) {
    throw new Error('Refresh token is required');
  }

  // 1. Verify token signature & expiration
  const decoded = verifyRefreshToken(oldRefreshToken);
  if (!decoded || !decoded.id) {
    throw new Error('Invalid or expired refresh token');
  }

  // 2. Check if token exists in database
  const tokenInDb = await findRefreshToken(oldRefreshToken);
  if (!tokenInDb) {
    // Reuse detection: If token was valid JWT but not in DB, revoke all user tokens for security
    await deleteUserRefreshTokens(decoded.id);
    throw new Error('Refresh token revoked or reused');
  }

  // 3. Delete used refresh token (Rotation)
  await deleteRefreshToken(oldRefreshToken);

  // 4. Issue new token pair
  const payload = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  };

  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  // 5. Store new refresh token in database
  await saveRefreshToken(decoded.id, newRefreshToken);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const initTokenCleanupCron = (): void => {
  // Run daily at midnight (00:00) to delete refresh tokens older than 7 days
  cron.schedule('0 0 * * *', async () => {
    try {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const deleted = await cleanupExpiredTokens(cutoffDate);
      console.log(`[Token Cleanup Cron] Removed ${deleted.length} expired refresh tokens.`);
    } catch (error) {
      console.error('[Token Cleanup Cron Error]:', error);
    }
  });
};
