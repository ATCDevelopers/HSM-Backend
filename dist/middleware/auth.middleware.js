import { verifyToken } from '../config/auth.config.js';
import { defineAbilityFor } from '../config/ability.js';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1]; // Extract Bearer token
    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }
    const decoded = verifyToken(token);
    if (!decoded) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }
    req.user = decoded;
    req.ability = defineAbilityFor(decoded);
    next();
};
