/**
 * Warehouse Routes — /api/v1/warehouse
 */
const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const ctrl = require('../controllers/warehouseController');

const guard = [verifyToken, requireRole('warehouse', 'admin')];

router.post('/entry',    ...guard, ctrl.createEntry);
router.get ('/entries',  ...guard, ctrl.getEntries);
router.get ('/summary',  ...guard, ctrl.getSummary);
router.get ('/revenue',  ...guard, ctrl.getRevenue);

module.exports = router;
