/**
 * AI Service Routes — /api/v1/ai
 * Calls Python FastAPI microservice (Phase 5)
 */
const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');
const { query } = require('../config/db');

router.use(verifyToken);

// POST /ai/classify — Queue image for YOLOv8 classification
router.post('/classify', async (req, res) => {
  try {
    const { image_url, collection_id } = req.body;
    const jobId = require('uuid').v4();
    // In Phase 5: call AI_SERVICE_URL and store result in ai_predictions
    // For now, return mock accepted response
    res.status(202).json({
      success:  true,
      job_id:   jobId,
      status:   'queued',
      message:  'Image queued for AI analysis. Result will be stored in ai_predictions.',
      collection_id,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /ai/jobs/:id — Check job status
router.get('/jobs/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM ai_predictions WHERE id=$1', [req.params.id]);
    if (!result.rows.length) {
      return res.json({ success: true, status: 'processing', message: 'Job still in queue' });
    }
    res.json({ success: true, status: 'done', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
