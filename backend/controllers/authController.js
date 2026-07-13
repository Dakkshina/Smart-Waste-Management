/**
 * Auth Controller — Register, Login, Refresh, Logout
 */
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET         = process.env.JWT_SECRET          || 'dev_secret_change_in_prod';
const JWT_EXPIRES        = process.env.JWT_EXPIRES_IN       || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET   || 'dev_refresh_secret';
const JWT_REFRESH_EXP    = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role, name: user.full_name };
  const token         = jwt.sign(payload, JWT_SECRET,         { expiresIn: JWT_EXPIRES });
  const refresh_token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXP });
  return { token, refresh_token };
};

// POST /api/v1/auth/register
const register = async (req, res) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    const allowed_roles = ['admin', 'collector', 'household', 'warehouse', 'authority'];
    if (!allowed_roles.includes(role)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ROLE', message: 'Invalid role specified' } });
    }

    const exists = await query('SELECT id FROM users WHERE email=$1 OR phone=$2', [email, phone]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Email or phone already registered' } });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (full_name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, full_name, email, role, created_at',
      [full_name, email, phone, password_hash, role]
    );

    const user = result.rows[0];
    const { token, refresh_token } = generateTokens(user);

    res.status(201).json({ success: true, user, token, refresh_token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// POST /api/v1/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Email and password required' } });
    }

    const result = await query('SELECT * FROM users WHERE email=$1 AND is_active=true', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    await query('INSERT INTO audit_logs (user_id, action, module) VALUES ($1,$2,$3)', [user.id, 'LOGIN', 'auth']);
    const { token, refresh_token } = generateTokens(user);

    res.json({
      success: true, token, refresh_token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// POST /api/v1/auth/refresh
const refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ success: false, error: { code: 'NO_TOKEN', message: 'Refresh token required' } });

    const decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET);
    const result  = await query('SELECT * FROM users WHERE id=$1 AND is_active=true', [decoded.id]);
    if (!result.rows.length) return res.status(401).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });

    const { token, refresh_token: new_refresh } = generateTokens(result.rows[0]);
    res.json({ success: true, token, refresh_token: new_refresh });
  } catch (err) {
    res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' } });
  }
};

// POST /api/v1/auth/logout
const logout = async (req, res) => {
  // In production: add token to a redis blocklist
  await query('INSERT INTO audit_logs (user_id, action, module) VALUES ($1,$2,$3)', [req.user.id, 'LOGOUT', 'auth']).catch(() => {});
  res.json({ success: true, message: 'Logged out successfully' });
};

// GET /api/v1/auth/me
const me = async (req, res) => {
  try {
    const result = await query('SELECT id, full_name, email, phone, role, created_at FROM users WHERE id=$1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

module.exports = { register, login, refresh, logout, me };
