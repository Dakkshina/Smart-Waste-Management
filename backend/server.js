/**
 * Smart Waste Management — Backend Server
 * Phase 2: Full Express API + WebSocket GPS
 */
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const http       = require('http');
const { WebSocketServer } = require('ws');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter   = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' });
const authLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,  message: 'Too many auth attempts' });
app.use('/api/',           apiLimiter);
app.use('/api/v1/auth/',   authLimiter);

// ─── Routes ────────────────────────────────────────────────────
app.use('/api/v1/auth',          require('./routes/auth'));
app.use('/api/v1/admin',         require('./routes/admin'));
app.use('/api/v1/collector',     require('./routes/collector'));
app.use('/api/v1/household',     require('./routes/household'));
app.use('/api/v1/warehouse',     require('./routes/warehouse'));
app.use('/api/v1/ai',            require('./routes/ai'));
app.use('/api/v1/notifications', require('./routes/notifications'));

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
});

// ─── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: { code: err.code || 'SERVER_ERROR', message: err.message }
  });
});

// ─── WebSocket — GPS Live Tracking ────────────────────────────
const wss = new WebSocketServer({ server, path: '/api/v1/gps/live' });
const gpsClients = new Set();

wss.on('connection', (ws, req) => {
  console.log('[WS] GPS client connected');
  gpsClients.add(ws);

  ws.on('message', (data) => {
    try {
      const payload = JSON.parse(data);
      // Broadcast GPS update to all connected admin clients
      const broadcast = JSON.stringify({ ...payload, received_at: new Date().toISOString() });
      gpsClients.forEach(client => {
        if (client !== ws && client.readyState === 1) client.send(broadcast);
      });
    } catch { /* ignore malformed messages */ }
  });

  ws.on('close', () => {
    gpsClients.delete(ws);
    console.log('[WS] GPS client disconnected');
  });

  // Send welcome ping
  ws.send(JSON.stringify({ type: 'connected', message: 'GPS stream active' }));
});

// Simulate live GPS updates in dev mode
if (process.env.NODE_ENV !== 'production') {
  const collectors = [
    { collector_id: 'mock-001', name: 'Ravi Kumar',   lat: 10.9610, lng: 78.0770 },
    { collector_id: 'mock-002', name: 'Meena Devi',   lat: 10.9590, lng: 78.0750 },
    { collector_id: 'mock-003', name: 'Priya Sharma', lat: 10.9625, lng: 78.0785 },
  ];
  setInterval(() => {
    collectors.forEach(c => {
      c.lat += (Math.random() - 0.5) * 0.0006;
      c.lng += (Math.random() - 0.5) * 0.0006;
      const msg = JSON.stringify({ type: 'gps_update', ...c, speed_kmph: (Math.random() * 30).toFixed(1), timestamp: new Date().toISOString() });
      gpsClients.forEach(client => { if (client.readyState === 1) client.send(msg); });
    });
  }, 5000);
}

// ─── Start ────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 SmartWaste API running on http://localhost:${PORT}`);
  console.log(`📡 GPS WebSocket at ws://localhost:${PORT}/api/v1/gps/live`);
  console.log(`🔍 Health check at http://localhost:${PORT}/health\n`);
});

module.exports = { app, server };
