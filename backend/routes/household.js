/**
 * Household Routes — /api/v1/household
 */
const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { query } = require('../config/db');

const guard = [verifyToken, requireRole('household', 'admin')];

// GET /household/me/status — Today's collection status
router.get('/me/status', ...guard, async (req, res) => {
  try {
    const resRes = await query('SELECT * FROM residents WHERE user_id=$1', [req.user.id]);
    if (!resRes.rows.length) return res.status(404).json({ success: false, error: { message: 'Resident profile not found' } });
    const resident = resRes.rows[0];
    const today    = new Date().toLocaleDateString('en-CA');

    const collRes = await query(
      `SELECT wc.status, wc.completed_at, u.full_name AS collector_name, u.phone AS collector_phone,
              gps.latitude, gps.longitude, gps.recorded_at AS last_seen
       FROM houses h
       JOIN waste_collections wc ON wc.house_id=h.id AND wc.collection_date=$1
       JOIN collectors c ON c.id=wc.collector_id
       JOIN users u ON u.id=c.user_id
       LEFT JOIN gps_tracking gps ON gps.collector_id=c.id
       WHERE h.resident_id=$2
       ORDER BY gps.recorded_at DESC LIMIT 1`,
      [today, resident.id]
    );
    res.json({ success: true, resident, collection: collRes.rows[0] || { status: 'pending' } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /household/feedback
router.post('/feedback', ...guard, async (req, res) => {
  try {
    const { collector_id, collection_id, behaviour_rating, comments } = req.body;
    const resRes = await query('SELECT id FROM residents WHERE user_id=$1', [req.user.id]);
    if (!resRes.rows.length) return res.status(404).json({ success: false, error: { message: 'Resident profile not found' } });
    const result = await query(
      'INSERT INTO feedback (resident_id,collector_id,collection_id,behaviour_rating,comments) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [resRes.rows[0].id, collector_id, collection_id, behaviour_rating, comments]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /household/complaints
router.post('/complaints', ...guard, async (req, res) => {
  try {
    const { title, description, priority, collector_id } = req.body;
    const resRes = await query('SELECT id FROM residents WHERE user_id=$1', [req.user.id]);
    if (!resRes.rows.length) return res.status(404).json({ success: false, error: { message: 'Resident profile not found' } });
    const result = await query(
      'INSERT INTO complaints (resident_id,collector_id,title,description,priority) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [resRes.rows[0].id, collector_id || null, title, description, priority || 'Medium']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /household/me/complaints
router.get('/me/complaints', ...guard, async (req, res) => {
  try {
    const resRes = await query('SELECT id FROM residents WHERE user_id=$1', [req.user.id]);
    if (!resRes.rows.length) return res.status(404).json({ success: false, error: { message: 'Resident profile not found' } });
    const result = await query(
      'SELECT * FROM complaints WHERE resident_id=$1 ORDER BY created_at DESC', [resRes.rows[0].id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /household/me/compliance
router.get('/me/compliance', ...guard, async (req, res) => {
  try {
    const resRes = await query('SELECT id FROM residents WHERE user_id=$1', [req.user.id]);
    if (!resRes.rows.length) return res.status(404).json({ success: false, error: { message: 'Resident profile not found' } });
    const result = await query(
      'SELECT * FROM compliance_scores WHERE resident_id=$1 ORDER BY year DESC, month DESC LIMIT 12', [resRes.rows[0].id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /household/garbage/status — Resident marks pickup
router.post('/garbage/status', ...guard, async (req, res) => {
  try {
    const { status } = req.body; // 'picked' | 'not_picked'
    res.json({ success: true, message: `Status recorded: ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
