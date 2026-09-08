/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Routes: /api/analytics
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyTokenAndRole } = require('../middleware/authMiddleware');

const COORD_OR_ADMIN = ['Society Admin', 'Placement Officer', 'Admin'];

router.get('/events', verifyTokenAndRole(COORD_OR_ADMIN), analyticsController.getEventParticipationStats);
router.get('/placements', verifyTokenAndRole(COORD_OR_ADMIN), analyticsController.getPlacementApplicationStats);
router.get('/overview', verifyTokenAndRole(['Admin']), analyticsController.getPlatformOverview);
router.get('/activity', verifyTokenAndRole(['Admin']), analyticsController.getRecentActivity);

module.exports = router;
