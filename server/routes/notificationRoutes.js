/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Routes: /api/notifications
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyTokenAndRole } = require('../middleware/authMiddleware');

const ANY_ROLE = ['Student', 'Society Admin', 'Placement Officer', 'Admin'];

router.get('/', verifyTokenAndRole(ANY_ROLE), notificationController.getMyNotifications);
router.put('/:id/read', verifyTokenAndRole(ANY_ROLE), notificationController.markAsRead);
router.put('/read-all', verifyTokenAndRole(ANY_ROLE), notificationController.markAllAsRead);

module.exports = router;
