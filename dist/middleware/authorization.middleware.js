export const adminOnly = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    if (req.user.role !== 'Admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
};
export const checkAbility = (action, subject) => {
    return (req, res, next) => {
        if (!req.user || !req.ability) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (req.ability.cannot(action, subject)) {
            res.status(403).json({ error: `Forbidden: You do not have permission to ${action} ${subject}` });
            return;
        }
        next();
    };
};
