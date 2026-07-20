/**
 * Admin Routes — /api/v1/admin
 * All routes require JWT + admin role
 */
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const anCtrl  = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const guard = [verifyToken, requireRole('admin')];

// Collectors
router.get   ('/collectors',     ...guard, ctrl.getCollectors);
router.post  ('/collectors',     ...guard, ctrl.createCollector);
router.get   ('/collectors/:id', ...guard, ctrl.getCollector);
router.put   ('/collectors/:id', ...guard, ctrl.updateCollector);
router.delete('/collectors/:id', ...guard, ctrl.deleteCollector);

// Vehicles
router.get ('/vehicles',     ...guard, ctrl.getVehicles);
router.post('/vehicles',     ...guard, ctrl.createVehicle);
router.put ('/vehicles/:id', ...guard, ctrl.updateVehicle);

// Routes
router.get ('/routes',     ...guard, ctrl.getRoutes);
router.post('/routes',     ...guard, ctrl.createRoute);
router.put ('/routes/:id', ...guard, ctrl.updateRoute);

// Salary
router.get ('/salary',           ...guard, ctrl.getSalary);
router.post('/salary/calculate', ...guard, ctrl.calculateSalary);

// Complaints
router.get('/complaints',     ...guard, ctrl.getComplaints);
router.put('/complaints/:id', ...guard, ctrl.updateComplaint);

// Analytics (Phase 6)
router.get('/analytics/daily',       ...guard, anCtrl.getDailyAnalytics);
router.get('/analytics/monthly',     ...guard, anCtrl.getMonthlyAnalytics);
router.get('/analytics/leaderboard', ...guard, anCtrl.getLeaderboard);

module.exports = router;
