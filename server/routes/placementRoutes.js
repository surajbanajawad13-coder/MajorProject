const express = require('express');
const router = express.Router();
const placementController = require('../controllers/placementController');
const { getMyPlacementMatchScores } = require('../controllers/recommendationController');
const { verifyTokenAndRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  buildStudentPlacementQuery,
  getPlacementEligibilityReason,
} = require('../services/placementEligibility');

// POST /api/placements
// Accepts multipart/form-data; field name must match frontend append ('jdFile')
router.post(
  '/',
  verifyTokenAndRole(['Placement Officer']),
  upload.single('jdFile'), 
  placementController.postNewDrive
);
router.put(
  '/:companyId',
  verifyTokenAndRole(['Placement Officer', 'Admin']),
  upload.single('jdFile'),
  placementController.updateDrive
);
router.delete(
  '/:companyId',
  verifyTokenAndRole(['Placement Officer', 'Admin']),
  placementController.deleteDrive
);
// server/routes/placementRoutes.js
router.get('/', verifyTokenAndRole(['Student', 'Placement Officer', 'Admin', 'Department Placement Coordinator']), async (req, res) => {
  try {
    const Company = require('../models/companySchema');
    let query = {};
    let studentProfile = null;
    if (req.role === 'Student') {
      const Student = require('../models/studentSchema');
      studentProfile = await Student.findById(req.userId).select('department cgpa year');
      if (!studentProfile) return res.status(404).json({ success: false, error: 'Student profile not found.' });
      query = buildStudentPlacementQuery(studentProfile);
    }
    const companies = await Company.find(query).sort({ createdAt: -1 });
    const visibleCompanies = studentProfile
      ? companies.map(company => ({
        ...company.toObject(),
        canApply: !getPlacementEligibilityReason(company, studentProfile),
        eligibilityReason: getPlacementEligibilityReason(company, studentProfile),
      }))
      : companies;
    res.json({ success: true, data: visibleCompanies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/placements/match-scores
// Returns { companyId: { score, rank_label, breakdown } } for the logged-in
// student so the company cards can explain an AI match. Placed above the
// '/:companyId/applicants' route so 'match-scores' isn't swallowed as a
// companyId param.
router.get(
  '/match-scores',
  verifyTokenAndRole(['Student']),
  getMyPlacementMatchScores
);

// GET /api/placements/:companyId/applicants
router.get(
  '/:companyId/applicants',
  verifyTokenAndRole(['Placement Officer', 'Admin', 'Department Placement Coordinator']),
  placementController.getDriveApplicants
);

// PUT /api/placements/:companyId/applicant/:studentId/status
router.put(
  '/:companyId/applicant/:studentId/status',
  verifyTokenAndRole(['Placement Officer', 'Admin', 'Department Placement Coordinator']),
  placementController.updateApplicantStatus
);

router.get(
  '/analytics/students',
  verifyTokenAndRole(['Placement Officer', 'Admin', 'Department Placement Coordinator']),
  placementController.getAllStudentsAnalytics
);
router.post(
  '/broadcast',
  verifyTokenAndRole(['Placement Officer', 'Admin', 'Department Placement Coordinator']),
  placementController.broadcastAlert
);
router.get('/broadcasts', verifyTokenAndRole(['Student', 'Placement Officer', 'Admin', 'Department Placement Coordinator']), async (req, res) => {
  try {
    const Broadcast = require('../models/broadcastSchema');
    const broadcasts = await Broadcast.find().sort({ createdAt: -1 }).limit(5); // Get latest broadcasts
    res.json({ success: true, data: broadcasts });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});
router.get(
  '/:companyId',
  verifyTokenAndRole(['Student', 'Placement Officer', 'Admin', 'Department Placement Coordinator']),
  placementController.getDrive
);

module.exports = router;
