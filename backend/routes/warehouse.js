/**
 * Warehouse Routes — /api/v1/warehouse
 */
const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { query } = require('../config/db');

const guard = [verifyToken, requireRole('warehouse', 'admin')];

// POST /warehouse/entry — Log incoming waste
router.post('/entry', ...guard, async (req, res) => {
  try {
    const { vehicle_id, plastic_kg=0, paper_kg=0, metal_kg=0, glass_kg=0, organic_kg=0, ewaste_kg=0, mixed_kg=0, revenue_inr=0 } = req.body;
    const result = await query(
      `INSERT INTO warehouse (vehicle_id,arrival_date,plastic_kg,paper_kg,metal_kg,glass_kg,organic_kg,ewaste_kg,mixed_kg,revenue_inr,operator_id)
       VALUES ($1,CURRENT_DATE,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [vehicle_id, plastic_kg, paper_kg, metal_kg, glass_kg, organic_kg, ewaste_kg, mixed_kg, revenue_inr, req.user.id]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /warehouse/summary
router.get('/summary', ...guard, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFrom = from || new Date(new Date().setDate(1)).toLocaleDateString('en-CA');
    const dateTo   = to   || new Date().toLocaleDateString('en-CA');
    const result = await query(
      `SELECT SUM(plastic_kg) AS plastic, SUM(paper_kg) AS paper, SUM(metal_kg) AS metal,
              SUM(glass_kg) AS glass, SUM(organic_kg) AS organic, SUM(ewaste_kg) AS ewaste,
              SUM(mixed_kg) AS mixed, SUM(total_kg) AS total, SUM(revenue_inr) AS revenue,
              COUNT(*) AS trips
       FROM warehouse WHERE arrival_date BETWEEN $1 AND $2`,
      [dateFrom, dateTo]
    );
    res.json({ success: true, period: { from: dateFrom, to: dateTo }, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /warehouse/entries
router.get('/entries', ...guard, async (req, res) => {
  try {
    const result = await query(
      `SELECT w.*, v.plate_number, u.full_name AS operator
       FROM warehouse w LEFT JOIN vehicles v ON v.id=w.vehicle_id LEFT JOIN users u ON u.id=w.operator_id
       ORDER BY w.arrival_date DESC, w.created_at DESC LIMIT 50`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
