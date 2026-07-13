/**
 * JWT Authentication Middleware
 */
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: 'Access token required' } });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = decoded;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: msg } });
  }
};

module.exports = { verifyToken };
