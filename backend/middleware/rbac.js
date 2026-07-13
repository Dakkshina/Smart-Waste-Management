/**
 * Role-Based Access Control Middleware
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: `Access denied. Required roles: ${allowedRoles.join(', ')}` }
      });
    }
    next();
  };
};

module.exports = { requireRole };
