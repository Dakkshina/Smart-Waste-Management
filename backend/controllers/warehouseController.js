/**
 * Warehouse Controller — Phase 6
 * Handles incoming waste logging, summaries, and revenue reports
 */
const { query } = require('../config/db');

// POST /warehouse/entry — log incoming vehicle load
const createEntry = async (req, res) => {
  try {
    const {
      vehicle_id, plastic_kg=0, paper_kg=0, metal_kg=0,
      glass_kg=0, organic_kg=0, ewaste_kg=0, mixed_kg=0, revenue_inr=0
    } = req.body;

    if (!vehicle_id) return res.status(400).json({ success:false, error:{ message:'vehicle_id required' } });

    const result = await query(
      `INSERT INTO warehouse
         (vehicle_id,arrival_date,arrival_time,plastic_kg,paper_kg,metal_kg,glass_kg,organic_kg,ewaste_kg,mixed_kg,revenue_inr,operator_id)
       VALUES ($1,CURRENT_DATE,NOW(),$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [vehicle_id, plastic_kg, paper_kg, metal_kg, glass_kg, organic_kg, ewaste_kg, mixed_kg, revenue_inr, req.user.id]
    );
    res.status(201).json({ success:true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success:false, error:{ message: err.message } });
  }
};

// GET /warehouse/entries — recent entries
const getEntries = async (req, res) => {
  try {
    const { limit=50, date } = req.query;
    let sql = `SELECT w.*, v.plate_number, v.vehicle_code, u.full_name AS operator
               FROM warehouse w
               LEFT JOIN vehicles v ON v.id=w.vehicle_id
               LEFT JOIN users u ON u.id=w.operator_id
               WHERE 1=1`;
    const params = [];
    if (date) { params.push(date); sql += ` AND w.arrival_date=$${params.length}`; }
    sql += ` ORDER BY w.arrival_time DESC LIMIT $${params.length+1}`;
    params.push(limit);
    const result = await query(sql, params);
    res.json({ success:true, count:result.rows.length, data:result.rows });
  } catch (err) {
    res.status(500).json({ success:false, error:{ message: err.message } });
  }
};

// GET /warehouse/summary — aggregated stats for a period
const getSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFrom = from || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const dateTo   = to   || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT
         SUM(organic_kg)  AS organic,  SUM(plastic_kg)  AS plastic,
         SUM(paper_kg)    AS paper,    SUM(metal_kg)    AS metal,
         SUM(glass_kg)    AS glass,    SUM(ewaste_kg)   AS ewaste,
         SUM(mixed_kg)    AS mixed,    SUM(total_kg)    AS total,
         SUM(recycled_kg) AS recycled, SUM(landfill_kg) AS landfill,
         SUM(revenue_inr) AS revenue,  COUNT(*)         AS trips
       FROM warehouse WHERE arrival_date BETWEEN $1 AND $2`,
      [dateFrom, dateTo]
    );
    res.json({ success:true, period:{ from:dateFrom, to:dateTo }, data:result.rows[0] });
  } catch (err) {
    res.status(500).json({ success:false, error:{ message: err.message } });
  }
};

// GET /warehouse/revenue — revenue breakdown by waste type
const getRevenue = async (req, res) => {
  try {
    const { month=new Date().getMonth()+1, year=new Date().getFullYear() } = req.query;
    const RATES = { plastic:8, paper:5, metal:18, glass:4, ewaste_kg:25 };
    const result = await query(
      `SELECT
         SUM(plastic_kg)  AS plastic,  SUM(paper_kg)  AS paper,
         SUM(metal_kg)    AS metal,    SUM(glass_kg)  AS glass,
         SUM(ewaste_kg)   AS ewaste,   SUM(revenue_inr) AS logged_revenue
       FROM warehouse
       WHERE EXTRACT(MONTH FROM arrival_date)=$1
         AND EXTRACT(YEAR  FROM arrival_date)=$2`,
      [month, year]
    );
    const d = result.rows[0];
    const breakdown = {
      plastic: { kg: d.plastic, rate:8,  revenue: d.plastic*8 },
      paper:   { kg: d.paper,   rate:5,  revenue: d.paper*5   },
      metal:   { kg: d.metal,   rate:18, revenue: d.metal*18  },
      glass:   { kg: d.glass,   rate:4,  revenue: d.glass*4   },
      ewaste:  { kg: d.ewaste,  rate:25, revenue: d.ewaste*25 },
    };
    const total = Object.values(breakdown).reduce((s,v)=>s+v.revenue,0);
    res.json({ success:true, month, year, breakdown, total_revenue: Math.round(total), logged_revenue: parseFloat(d.logged_revenue||0) });
  } catch (err) {
    res.status(500).json({ success:false, error:{ message: err.message } });
  }
};

module.exports = { createEntry, getEntries, getSummary, getRevenue };
