/**
 * Smart Waste Management System — Backend API
 * Phase 2 scaffold (Phase 1: structure only)
 */

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// ─── Routes (to be implemented in Phase 2+) ───────────────────
app.use('/api/v1/auth',        require('./routes/auth'));
app.use('/api/v1/admin',       require('./routes/admin'));
app.use('/api/v1/collector',   require('./routes/collector'));
app.use('/api/v1/household',   require('./routes/household'));
app.use('/api/v1/warehouse',   require('./routes/warehouse'));
app.use('/api/v1/ai',          require('./routes/ai'));
app.use('/api/v1/notifications', require('./routes/notifications'));

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: { code: err.code || 'SERVER_ERROR', message: err.message }
  });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
module.exports = app;
