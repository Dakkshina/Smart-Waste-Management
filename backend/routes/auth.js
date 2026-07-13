/**
 * Auth Routes — /api/v1/auth
 */
const express = require('express');
const router  = express.Router();
const { register, login, refresh, logout, me } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public
router.post('/register', register);
router.post('/login',    login);
router.post('/refresh',  refresh);

// Protected
router.post('/logout', verifyToken, logout);
router.get('/me',      verifyToken, me);

module.exports = router;
