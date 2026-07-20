/**
 * Analytics Controller — Phase 6
 * Powers the Analytics Dashboard with aggregated data
 */
const { query } = require('../config/db');

// GET /admin/analytics/daily?date=2025-07-11
const getDailyAnalytics = async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const [collRes, wasteRes, aiRes, topRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE status='collected')     AS collected,
               COUNT(*) FILTER (WHERE status='not_available') AS not_available,
               COUNT(*) FILTER (WHERE status='pending')       AS pending
             FROM waste_collections WHERE collection_date=$1`, [date]),
      query(`SELECT SUM(total_kg) AS total_kg, SUM(organic_kg) AS organic,
               SUM(plastic_kg) AS plastic, SUM(recycled_kg) AS recycled,
               SUM(revenue_inr) AS revenue
             FROM warehouse WHERE arrival_date=$1`, [date]),
      query(`SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE mixed_waste=false) AS passed,
               COUNT(*) FILTER (WHERE mixed_waste=true)  AS failed,
               AVG(confidence)::NUMERIC(5,2) AS avg_confidence
             FROM ai_predictions ap
             JOIN waste_collections wc ON wc.id=ap.collection_id
             WHERE wc.collection_date=$1`, [date]),
      query(`SELECT u.full_name, COUNT(*) FILTER (WHERE wc.status='collected') AS done,
               COUNT(*) AS total
             FROM collectors c JOIN users u ON u.id=c.user_id
             LEFT JOIN waste_collections wc ON wc.collector_id=c.id AND wc.collection_date=$1
             GROUP BY u.full_name ORDER BY done DESC LIMIT 1`, [date]),
    ]);

    const coll  = collRes.rows[0];
    const waste = wasteRes.rows[0];
    const ai    = aiRes.rows[0];
    const top   = topRes.rows[0];

    res.json({
      success: true, date,
      collection: {
        total:         parseInt(coll.total),
        collected:     parseInt(coll.collected),
        not_available: parseInt(coll.not_available),
        pending:       parseInt(coll.pending),
        rate_pct:      coll.total > 0 ? Math.round(coll.collected/coll.total*100) : 0,
      },
      waste: {
        total_kg:   parseFloat(waste.total_kg   || 0),
        organic_kg: parseFloat(waste.organic    || 0),
        plastic_kg: parseFloat(waste.plastic    || 0),
        recycled_kg:parseFloat(waste.recycled   || 0),
        revenue:    parseFloat(waste.revenue    || 0),
      },
      ai: {
        total:          parseInt(ai.total),
        passed:         parseInt(ai.passed),
        failed:         parseInt(ai.failed),
        avg_confidence: parseFloat(ai.avg_confidence || 0),
        pass_rate:      ai.total > 0 ? Math.round(ai.passed/ai.total*100) : 0,
      },
      top_collector: top || null,
    });
  } catch (err) {
    res.status(500).json({ success:false, error:{ message: err.message } });
  }
};

// GET /admin/analytics/monthly?month=7&year=2025
const getMonthlyAnalytics = async (req, res) => {
  try {
    const { month=new Date().getMonth()+1, year=new Date().getFullYear() } = req.query;

    const [collRes, wasteRes, salRes, compRes] = await Promise.all([
      query(`SELECT collection_date AS date,
               COUNT(*) AS total,
               COUNT(*) FILTER (WHERE status='collected') AS collected
             FROM waste_collections
             WHERE EXTRACT(MONTH FROM collection_date)=$1
               AND EXTRACT(YEAR  FROM collection_date)=$2
             GROUP BY collection_date ORDER BY collection_date`, [month, year]),
      query(`SELECT SUM(total_kg) AS total, SUM(organic_kg) AS organic,
               SUM(plastic_kg) AS plastic, SUM(revenue_inr) AS revenue
             FROM warehouse
             WHERE EXTRACT(MONTH FROM arrival_date)=$1
               AND EXTRACT(YEAR  FROM arrival_date)=$2`, [month, year]),
      query(`SELECT SUM(final_salary) AS total_payout, COUNT(*) AS collectors
             FROM salary WHERE month=$1 AND year=$2`, [month, year]),
      query(`SELECT AVG(compliance_pct)::NUMERIC(5,2) AS avg_compliance
             FROM compliance_scores WHERE month=$1 AND year=$2`, [month, year]),
    ]);

    res.json({
      success:true, month, year,
      daily_collection: collRes.rows,
      waste:  wasteRes.rows[0],
      salary: salRes.rows[0],
      avg_compliance: parseFloat(compRes.rows[0]?.avg_compliance || 0),
    });
  } catch (err) {
    res.status(500).json({ success:false, error:{ message: err.message } });
  }
};

// GET /admin/analytics/leaderboard?month=7&year=2025
const getLeaderboard = async (req, res) => {
  try {
    const { month=new Date().getMonth()+1, year=new Date().getFullYear() } = req.query;
    const result = await query(
      `SELECT u.full_name, c.employee_id, c.zone_assigned,
         COUNT(*) FILTER (WHERE wc.status='collected') AS collected,
         COUNT(*) AS total_assigned,
         CASE WHEN COUNT(*)>0
           THEN ROUND(COUNT(*) FILTER (WHERE wc.status='collected')::NUMERIC/COUNT(*)*100,1)
           ELSE 0 END AS collection_pct,
         COALESCE(AVG(r.stars),0)::NUMERIC(3,1) AS avg_rating,
         s.final_salary
       FROM collectors c
       JOIN users u ON u.id=c.user_id
       LEFT JOIN waste_collections wc ON wc.collector_id=c.id
         AND EXTRACT(MONTH FROM wc.collection_date)=$1
         AND EXTRACT(YEAR  FROM wc.collection_date)=$2
       LEFT JOIN ratings r ON r.collector_id=c.id AND r.month=$1 AND r.year=$2
       LEFT JOIN salary s  ON s.collector_id=c.id AND s.month=$1 AND s.year=$2
       GROUP BY u.full_name, c.employee_id, c.zone_assigned, s.final_salary
       ORDER BY collection_pct DESC`,
      [month, year]
    );
    res.json({ success:true, month, year, leaderboard: result.rows });
  } catch (err) {
    res.status(500).json({ success:false, error:{ message: err.message } });
  }
};

module.exports = { getDailyAnalytics, getMonthlyAnalytics, getLeaderboard };
