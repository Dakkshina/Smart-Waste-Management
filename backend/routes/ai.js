/**
 * AI Routes — /api/v1/ai
 * Proxies requests to the Python FastAPI microservice
 */
const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');
const { query }       = require('../config/db');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ── Helper: call AI microservice ─────────────────────────────
async function callAI(endpoint, options = {}) {
  const url  = `${AI_SERVICE_URL}${endpoint}`;
  const resp = await fetch(url, { timeout: 30000, ...options });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: { message: resp.statusText } }));
    throw Object.assign(new Error(err.error?.message || resp.statusText), { status: resp.status });
  }
  return resp.json();
}

// ── POST /ai/classify — upload image file ────────────────────
router.post('/classify', verifyToken, async (req, res) => {
  try {
    const FormData = (await import('form-data')).default;
    const { collection_id } = req.query;

    if (!req.files || !req.files.photo) {
      // Fallback: classify via base64 body
      if (req.body.image_base64) {
        const result = await callAI('/classify/base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: req.body.image_base64, collection_id }),
        });
        return res.json({ success: true, ...result });
      }
      return res.status(400).json({ success: false, error: { code: 'NO_IMAGE', message: 'No image provided' } });
    }

    const form = new FormData();
    form.append('file', req.files.photo.data, { filename: req.files.photo.name });

    const result = await callAI(`/classify?collection_id=${collection_id || ''}&sync=true`, {
      method: 'POST', body: form, headers: form.getHeaders(),
    });

    // Persist to ai_predictions table
    if (result.status === 'done' && result.result && collection_id) {
      const r = result.result;
      await query(
        `INSERT INTO ai_predictions
         (collection_id, plastic_pct, paper_pct, metal_pct, glass_pct, organic_pct, ewaste_pct, mixed_waste, confidence, model_version)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          collection_id,
          r.class_percentages?.Plastic  || 0,
          r.class_percentages?.Paper    || 0,
          r.class_percentages?.Metal    || 0,
          r.class_percentages?.Glass    || 0,
          r.class_percentages?.Organic  || 0,
          r.class_percentages?.['E-Waste'] || 0,
          r.mixed_waste,
          r.confidence,
          r.model_version,
        ]
      ).catch(dbErr => console.warn('[AI] DB insert failed:', dbErr.message));
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[AI] classify error:', err.message);
    res.status(err.status || 502).json({
      success: false,
      error: { code: 'AI_SERVICE_ERROR', message: err.message }
    });
  }
});

// ── POST /ai/classify/url ────────────────────────────────────
router.post('/classify/url', verifyToken, async (req, res) => {
  try {
    const result = await callAI('/classify/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(502).json({ success: false, error: { code: 'AI_SERVICE_ERROR', message: err.message } });
  }
});

// ── GET /ai/jobs/:id ─────────────────────────────────────────
router.get('/jobs/:id', verifyToken, async (req, res) => {
  try {
    const result = await callAI(`/jobs/${req.params.id}`);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 502).json({ success: false, error: { message: err.message } });
  }
});

// ── GET /ai/health ───────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const result = await callAI('/health');
    res.json({ success: true, ai_service: result });
  } catch {
    res.status(503).json({ success: false, error: { code: 'AI_UNAVAILABLE', message: 'AI service is not reachable' } });
  }
});

// ── GET /ai/model/info ───────────────────────────────────────
router.get('/model/info', async (req, res) => {
  try {
    const result = await callAI('/model/info');
    res.json({ success: true, model: result });
  } catch (err) {
    res.status(502).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
