/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Routes: /api/events
 * Purpose: Full CRUD for technical events + registration + participation
 *          analytics used by the Coordinator dashboard.
 *
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyTokenAndRole } = require('../middleware/authMiddleware');

// Public listing/detail so learners can browse without extra round trips
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.get(
  '/:id/participation',
  verifyTokenAndRole(['Society Admin', 'Placement Officer', 'Admin']),
  eventController.getEventParticipation
);

// Coordinator-only management
router.post(
  '/',
  verifyTokenAndRole(['Society Admin', 'Admin']),
  eventController.createEvent
);
router.put(
  '/:id',
  verifyTokenAndRole(['Society Admin', 'Admin']),
  eventController.updateEvent
);
router.delete(
  '/:id',
  verifyTokenAndRole(['Society Admin', 'Admin']),
  eventController.deleteEvent
);

// Learner registration
router.post(
  '/:id/register',
  verifyTokenAndRole(['Student']),
  eventController.registerForEvent
);

module.exports = router;
