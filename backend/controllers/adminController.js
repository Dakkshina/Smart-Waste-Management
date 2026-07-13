/**
 * Admin Controller — Collectors, Vehicles, Routes, Salary, Complaints, Analytics
 */
const { query } = require('../config/db');
const bcrypt    = require('bcryptjs');

/* ────────────────────────────── COLLECTORS ──────────────────────────────── */

// GET /admin/collectors
const getCollectors = async (req, res) => {
  try {
    const { zone, on_duty, search } = req.query;
    let sql = `
      SELECT c.*, u.full_name, u.email, u.phone, u.is_active,
             COALESCE(AVG(r.stars),0)::NUMERIC(3,1) AS avg_rating,
             COUNT(DISTINCT r.id) AS total_ratings
      FROM collectors c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN ratings r ON r.collector_id = c.id
      WHERE 1=1`;
    const params = [];
    if (zone)     { params.push(zone);    sql += ` AND c.zone_assigned=$${params.length}`; }
    if (on_duty !== undefined) { params.push(on_duty === 'true'); sql += ` AND c.is_on_duty=$${params.length}`; }
    if (search)   { params.push(`%${search}%`); sql += ` AND (u.full_name ILIKE $${params.length} OR c.employee_id ILIKE $${params.length})`; }
    sql += ' GROUP BY c.id, u.full_name, u.email, u.phone, u.is_active ORDER BY u.full_name';
    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// POST /admin/collectors
const createCollector = async (req, res) => {
  const client = await require('../config/db').getClient();
  try {
    await client.query('BEGIN');
    const { full_name, email, phone, zone_assigned, joining_date, base_salary } = req.body;

    const password_hash = await bcrypt.hash('Welcome@123', 12); // default password
    const userRes = await client.query(
      'INSERT INTO users (full_name,email,phone,password_hash,role) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [full_name, email, phone, password_hash, 'collector']
    );
    const userId = userRes.rows[0].id;
    const empId  = `EMP-${String(Date.now()).slice(-6)}`;

    const colRes = await client.query(
      'INSERT INTO collectors (user_id,employee_id,zone_assigned,joining_date,base_salary) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [userId, empId, zone_assigned, joining_date || new Date(), base_salary || 12000]
    );
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { ...colRes.rows[0], full_name, email, phone } });
  } catch (err) {
    await client.query('ROLLBACK');
    const msg = err.code === '23505' ? 'Email or phone already exists' : err.message;
    res.status(err.code === '23505' ? 409 : 500).json({ success: false, error: { code: 'DB_ERROR', message: msg } });
  } finally { client.release(); }
};

// GET /admin/collectors/:id
const getCollector = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT c.*, u.full_name, u.email, u.phone,
              COALESCE(AVG(r.stars),0)::NUMERIC(3,1) AS avg_rating
       FROM collectors c JOIN users u ON u.id=c.user_id
       LEFT JOIN ratings r ON r.collector_id=c.id
       WHERE c.id=$1 GROUP BY c.id, u.full_name, u.email, u.phone`, [id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Collector not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// PUT /admin/collectors/:id
const updateCollector = async (req, res) => {
  try {
    const { id } = req.params;
    const { zone_assigned, base_salary, is_on_duty } = req.body;
    const result = await query(
      'UPDATE collectors SET zone_assigned=COALESCE($1,zone_assigned), base_salary=COALESCE($2,base_salary), is_on_duty=COALESCE($3,is_on_duty) WHERE id=$4 RETURNING *',
      [zone_assigned, base_salary, is_on_duty, id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Collector not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// DELETE /admin/collectors/:id
const deleteCollector = async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE users SET is_active=false WHERE id=(SELECT user_id FROM collectors WHERE id=$1)', [id]);
    res.json({ success: true, message: 'Collector deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/* ────────────────────────────── VEHICLES ──────────────────────────────── */

const getVehicles = async (req, res) => {
  try {
    const result = await query(
      `SELECT v.*, u.full_name AS assigned_name
       FROM vehicles v LEFT JOIN collectors c ON c.id=v.assigned_to
       LEFT JOIN users u ON u.id=c.user_id ORDER BY v.vehicle_code`
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

const createVehicle = async (req, res) => {
  try {
    const { vehicle_code, plate_number, type, capacity_kg, gps_device_id, assigned_to } = req.body;
    const result = await query(
      'INSERT INTO vehicles (vehicle_code,plate_number,type,capacity_kg,gps_device_id,assigned_to) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [vehicle_code, plate_number, type, capacity_kg, gps_device_id, assigned_to || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const msg = err.code === '23505' ? 'Vehicle code or plate already exists' : err.message;
    res.status(err.code === '23505' ? 409 : 500).json({ success: false, error: { code: 'DB_ERROR', message: msg } });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { plate_number, type, capacity_kg, is_active, assigned_to } = req.body;
    const result = await query(
      'UPDATE vehicles SET plate_number=COALESCE($1,plate_number), type=COALESCE($2,type), capacity_kg=COALESCE($3,capacity_kg), is_active=COALESCE($4,is_active), assigned_to=COALESCE($5,assigned_to) WHERE id=$6 RETURNING *',
      [plate_number, type, capacity_kg, is_active, assigned_to, id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/* ────────────────────────────── ROUTES ──────────────────────────────── */

const getRoutes = async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, u.full_name AS collector_name, v.plate_number,
              COUNT(h.id) AS house_count
       FROM routes r
       LEFT JOIN collectors c ON c.id=r.assigned_collector
       LEFT JOIN users u ON u.id=c.user_id
       LEFT JOIN vehicles v ON v.id=r.assigned_vehicle
       LEFT JOIN houses h ON h.route_id=r.id
       GROUP BY r.id, u.full_name, v.plate_number ORDER BY r.route_name`
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

const createRoute = async (req, res) => {
  try {
    const { route_name, zone, assigned_collector, assigned_vehicle, schedule_day, estimated_km } = req.body;
    const result = await query(
      'INSERT INTO routes (route_name,zone,assigned_collector,assigned_vehicle,schedule_day,estimated_km) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [route_name, zone, assigned_collector, assigned_vehicle || null, schedule_day, estimated_km || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { route_name, zone, assigned_collector, assigned_vehicle, schedule_day, is_active } = req.body;
    const result = await query(
      `UPDATE routes SET route_name=COALESCE($1,route_name), zone=COALESCE($2,zone),
       assigned_collector=COALESCE($3,assigned_collector), assigned_vehicle=COALESCE($4,assigned_vehicle),
       schedule_day=COALESCE($5,schedule_day), is_active=COALESCE($6,is_active)
       WHERE id=$7 RETURNING *`,
      [route_name, zone, assigned_collector, assigned_vehicle, schedule_day, is_active, id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/* ────────────────────────────── SALARY ──────────────────────────────── */

const getSalary = async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    const result = await query(
      `SELECT s.*, u.full_name FROM salary s
       JOIN collectors c ON c.id=s.collector_id
       JOIN users u ON u.id=c.user_id
       WHERE s.month=$1 AND s.year=$2 ORDER BY u.full_name`,
      [month, year]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

const calculateSalary = async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.body;
    const collectors = await query('SELECT id, base_salary FROM collectors WHERE is_on_duty IS NOT NULL');
    let processed = 0;
    for (const col of collectors.rows) {
      const [attRes, colRes, segRes, ratRes] = await Promise.all([
        query(`SELECT COUNT(*) FROM attendance WHERE collector_id=$1 AND EXTRACT(MONTH FROM date)=$2 AND EXTRACT(YEAR FROM date)=$3 AND status='present'`, [col.id, month, year]),
        query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='collected') AS done FROM waste_collections WHERE collector_id=$1 AND EXTRACT(MONTH FROM collection_date)=$2`, [col.id, month]),
        query(`SELECT AVG(CASE WHEN mixed_waste=false THEN 100 ELSE 0 END) AS seg_pct FROM ai_predictions ap JOIN waste_collections wc ON wc.id=ap.collection_id WHERE wc.collector_id=$1 AND EXTRACT(MONTH FROM wc.collection_date)=$2`, [col.id, month]),
        query(`SELECT AVG(stars) AS avg_stars FROM ratings WHERE collector_id=$1 AND month=$2 AND year=$3`, [col.id, month, year]),
      ]);
      const base    = col.base_salary;
      const att_pct = Math.min(parseFloat(attRes.rows[0].count || 0) / 26 * 100, 100);
      const col_pct = colRes.rows[0].total > 0 ? (colRes.rows[0].done / colRes.rows[0].total) * 100 : 0;
      const seg_pct = parseFloat(segRes.rows[0].seg_pct || 0);
      const stars   = parseFloat(ratRes.rows[0].avg_stars || 0);

      const collection_bonus  = Math.round(base * 0.30 * (col_pct / 100));
      const segregation_bonus = Math.round(base * 0.25 * (seg_pct / 100));
      const attendance_bonus  = Math.round(base * 0.20 * (att_pct / 100));
      const rating_bonus      = Math.round(base * 0.15 * (stars / 5));

      await query(
        `INSERT INTO salary (collector_id,month,year,base_salary,collection_bonus,segregation_bonus,attendance_bonus,rating_bonus,penalty)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0)
         ON CONFLICT (collector_id,month,year) DO UPDATE SET
         collection_bonus=$5, segregation_bonus=$6, attendance_bonus=$7, rating_bonus=$8`,
        [col.id, month, year, base, collection_bonus, segregation_bonus, attendance_bonus, rating_bonus]
      );
      processed++;
    }
    const total = await query(`SELECT SUM(final_salary) FROM salary WHERE month=$1 AND year=$2`, [month, year]);
    res.json({ success: true, processed, total_payout: parseFloat(total.rows[0].sum || 0) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/* ────────────────────────────── COMPLAINTS ──────────────────────────────── */

const getComplaints = async (req, res) => {
  try {
    const { status, priority } = req.query;
    let sql = `SELECT comp.*, u1.full_name AS resident_name, u2.full_name AS collector_name
               FROM complaints comp
               LEFT JOIN residents r ON r.id=comp.resident_id LEFT JOIN users u1 ON u1.id=r.user_id
               LEFT JOIN collectors c ON c.id=comp.collector_id LEFT JOIN users u2 ON u2.id=c.user_id
               WHERE 1=1`;
    const params = [];
    if (status)   { params.push(status);   sql += ` AND comp.status=$${params.length}`; }
    if (priority) { params.push(priority); sql += ` AND comp.priority=$${params.length}`; }
    sql += ' ORDER BY comp.created_at DESC';
    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to } = req.body;
    const resolved_at = status === 'resolved' ? new Date() : null;
    const result = await query(
      `UPDATE complaints SET status=COALESCE($1,status), assigned_to=COALESCE($2,assigned_to),
       resolved_at=COALESCE($3,resolved_at) WHERE id=$4 RETURNING *`,
      [status, assigned_to, resolved_at, id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Complaint not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/* ────────────────────────────── ANALYTICS ──────────────────────────────── */

const getDailyAnalytics = async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    const [wasteRes, collRes, complRes] = await Promise.all([
      query(`SELECT SUM(plastic_kg+paper_kg+metal_kg+glass_kg+organic_kg+ewaste_kg+mixed_kg) AS total_kg, SUM(plastic_kg) AS plastic, SUM(organic_kg) AS organic FROM warehouse WHERE arrival_date=$1`, [date]),
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='collected') AS collected, COUNT(*) FILTER (WHERE status='not_available') AS not_available FROM waste_collections WHERE collection_date=$1`, [date]),
      query(`SELECT COUNT(*) AS open FROM complaints WHERE status='open'`),
    ]);
    res.json({
      success: true, date,
      collection: collRes.rows[0],
      waste: wasteRes.rows[0],
      open_complaints: parseInt(complRes.rows[0].open),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

module.exports = {
  getCollectors, createCollector, getCollector, updateCollector, deleteCollector,
  getVehicles, createVehicle, updateVehicle,
  getRoutes, createRoute, updateRoute,
  getSalary, calculateSalary,
  getComplaints, updateComplaint,
  getDailyAnalytics,
};
