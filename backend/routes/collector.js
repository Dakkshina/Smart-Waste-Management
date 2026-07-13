/**
 * Collector Routes — /api/v1/collector
 */
const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { query } = require('../config/db');

const guard = [verifyToken, requireRole('collector', 'admin')];

// GET /collector/me/route — today's route + house list
router.get('/me/route', ...guard, async (req, res) => {
  try {
    const colRes = await query('SELECT id FROM collectors WHERE user_id=$1', [req.user.id]);
    if (!colRes.rows.length) return res.status(404).json({ success: false, error: { message: 'Collector profile not found' } });
    const collectorId = colRes.rows[0].id;
    const today = new Date().toLocaleDateString('en-CA');
    const day   = new Date().toLocaleDateString('en-US', { weekday: 'short' });

    const route = await query(
      `SELECT r.* FROM routes r WHERE r.assigned_collector=$1 AND r.schedule_day ILIKE $2 AND r.is_active=true LIMIT 1`,
      [collectorId, `%${day}%`]
    );
    if (!route.rows.length) return res.json({ success: true, route: null, houses: [], stats: { total: 0, completed: 0, pending: 0 } });

    const houses = await query(
      `SELECT h.*, r.full_name AS resident_name, r.house_number, r.latitude, r.longitude, r.qr_code_token,
              wc.status AS collection_status
       FROM houses h
       JOIN residents r ON r.id=h.resident_id
       LEFT JOIN waste_collections wc ON wc.house_id=h.id AND wc.collection_date=$1
       WHERE h.route_id=$2 ORDER BY h.sequence_order`,
      [today, route.rows[0].id]
    );

    const stats = {
      total:     houses.rows.length,
      completed: houses.rows.filter(h => h.collection_status === 'collected').length,
      pending:   houses.rows.filter(h => !h.collection_status || h.collection_status === 'pending').length,
      not_available: houses.rows.filter(h => h.collection_status === 'not_available').length,
    };
    res.json({ success: true, route: route.rows[0], houses: houses.rows, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /collector/duty/start
router.post('/duty/start', ...guard, async (req, res) => {
  try {
    const colRes = await query('SELECT id FROM collectors WHERE user_id=$1', [req.user.id]);
    if (!colRes.rows.length) return res.status(404).json({ success: false, error: { message: 'Profile not found' } });
    await query('UPDATE collectors SET is_on_duty=true WHERE id=$1', [colRes.rows[0].id]);
    const today = new Date().toLocaleDateString('en-CA');
    await query(
      `INSERT INTO attendance (collector_id, date, check_in, status) VALUES ($1,$2,NOW(),'present')
       ON CONFLICT (collector_id, date) DO UPDATE SET check_in=NOW(), status='present'`,
      [colRes.rows[0].id, today]
    );
    res.json({ success: true, message: 'Duty started. GPS is now active.' });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /collector/duty/end
router.post('/duty/end', ...guard, async (req, res) => {
  try {
    const colRes = await query('SELECT id FROM collectors WHERE user_id=$1', [req.user.id]);
    if (!colRes.rows.length) return res.status(404).json({ success: false, error: { message: 'Profile not found' } });
    await query('UPDATE collectors SET is_on_duty=false WHERE id=$1', [colRes.rows[0].id]);
    const today = new Date().toLocaleDateString('en-CA');
    await query('UPDATE attendance SET check_out=NOW() WHERE collector_id=$1 AND date=$2', [colRes.rows[0].id, today]);
    res.json({ success: true, message: 'Duty ended. GPS stopped.' });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /collector/me/gps/update
router.post('/me/gps/update', ...guard, async (req, res) => {
  try {
    const { latitude, longitude, speed_kmph, heading_deg } = req.body;
    const colRes = await query('SELECT id FROM collectors WHERE user_id=$1', [req.user.id]);
    if (!colRes.rows.length) return res.status(404).json({ success: false, error: { message: 'Profile not found' } });
    await query(
      'INSERT INTO gps_tracking (collector_id, latitude, longitude, speed_kmph, heading_deg) VALUES ($1,$2,$3,$4,$5)',
      [colRes.rows[0].id, latitude, longitude, speed_kmph || 0, heading_deg || 0]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /collector/collections/:id/complete
router.post('/collections/:id/complete', ...guard, async (req, res) => {
  try {
    const { id } = req.params;
    await query(
      `UPDATE waste_collections SET status='collected', completed_at=NOW() WHERE id=$1`,
      [id]
    );
    res.json({ success: true, message: 'Collection marked complete. Image queued for AI.' });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /collector/collections/:id/not-available
router.post('/collections/:id/not-available', ...guard, async (req, res) => {
  try {
    const { id } = req.params;
    await query(`UPDATE waste_collections SET status='not_available' WHERE id=$1`, [id]);
    res.json({ success: true, message: 'Marked as not available.' });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /collector/me/stats
router.get('/me/stats', ...guard, async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    const colRes = await query('SELECT id FROM collectors WHERE user_id=$1', [req.user.id]);
    if (!colRes.rows.length) return res.status(404).json({ success: false, error: { message: 'Profile not found' } });
    const cid = colRes.rows[0].id;
    const [collRes, ratRes, attRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='collected') AS done FROM waste_collections WHERE collector_id=$1 AND EXTRACT(MONTH FROM collection_date)=$2 AND EXTRACT(YEAR FROM collection_date)=$3`, [cid, month, year]),
      query(`SELECT COALESCE(AVG(stars),0)::NUMERIC(3,1) AS avg FROM ratings WHERE collector_id=$1 AND month=$2 AND year=$3`, [cid, month, year]),
      query(`SELECT COUNT(*) FROM attendance WHERE collector_id=$1 AND EXTRACT(MONTH FROM date)=$2 AND status='present'`, [cid, month]),
    ]);
    res.json({
      success: true,
      stats: {
        total_assigned: parseInt(collRes.rows[0].total),
        collected:      parseInt(collRes.rows[0].done),
        collection_pct: collRes.rows[0].total > 0 ? Math.round(collRes.rows[0].done / collRes.rows[0].total * 100) : 0,
        avg_rating:     parseFloat(ratRes.rows[0].avg),
        days_present:   parseInt(attRes.rows[0].count),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
