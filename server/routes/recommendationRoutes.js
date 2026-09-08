/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Routes: /api/recommendations
 * Purpose: Exposes the AI-driven recommendation endpoint to learners.
 *
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendationController');
const { verifyTokenAndRole } = require('../middleware/authMiddleware');

// GET /api/recommendations/:userId
// A student can only fetch their own recommendations; TPO/Admin may
// look up any learner's recommendations (e.g. for advising purposes).
router.get(
  '/:userId',
  verifyTokenAndRole(['Student', 'Placement Officer', 'Admin']),
  (req, res, next) => {
    if (
      req.role === 'Student' &&
      req.userId?.toString() !== req.params.userId?.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Forbidden: cannot view another learner\'s recommendations' });
    }
    next();
  },
  getRecommendations
);

module.exports = router;
