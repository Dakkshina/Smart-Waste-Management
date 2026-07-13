/**
 * Notifications Routes — /api/v1/notifications
 */
const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');
const { query } = require('../config/db');

router.use(verifyToken);

// GET /notifications/me
router.get('/me', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY sent_at DESC LIMIT 30', [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /notifications/read-all
router.put('/read-all', async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
