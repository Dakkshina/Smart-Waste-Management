const express = require('express');
const router  = express.Router();

// TODO: Implement notifications routes in Phase 2+
// See docs/API_DESIGN.md for full endpoint specification

router.get('/', (req, res) => {
  res.json({ success: true, message: 'notifications route — Phase 2 pending' });
});

module.exports = router;
