const express = require('express');
const router = express.Router();
const placementController = require('../controllers/placementController');
const { verifyTokenAndRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// POST /api/placements
// Accepts multipart/form-data; field name must match frontend append ('jdFile')
router.post(
  '/',
  verifyTokenAndRole(['Placement Officer']),
  upload.single('jdFile'), 
  placementController.postNewDrive
);
// server/routes/placementRoutes.js
router.get('/', async (req, res) => {
  try {
    const Company = require('../models/companySchema');
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json({ success: true, data: companies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// GET /api/placements/:companyId/applicants
router.get(
  '/:companyId/applicants',
  verifyTokenAndRole(['Placement Officer', 'Admin']),
  placementController.getDriveApplicants
);

// PUT /api/placements/:companyId/applicant/:studentId/status
router.put(
  '/:companyId/applicant/:studentId/status',
  verifyTokenAndRole(['Placement Officer', 'Admin']),
  placementController.updateApplicantStatus
);

router.get(
  '/analytics/students',
  verifyTokenAndRole(['Placement Officer', 'Admin']),
  placementController.getAllStudentsAnalytics
);

module.exports = router;