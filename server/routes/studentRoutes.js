const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController.js');
const { analyzeResume } = require('../controllers/recommendationController.js');
const { verifyTokenAndRole } = require('../middleware/authMiddleware.js');
const upload = require('../middleware/uploadMiddleware.js');

// GET  /api/student/dashboard
router.get(
  '/dashboard',
  verifyTokenAndRole(['Student']),
  studentController.getStudentDashboard
);

// PUT  /api/student/profile
// Accepts multipart/form-data; resume is optional (field name: "resume")
router.put(
  '/profile',
  verifyTokenAndRole(['Student']),
  upload.single('resume'),          // multer processes file field "resume"
  studentController.updateStudentProfile
);

router.post(
  '/apply',
  verifyTokenAndRole(['Student']),
  studentController.applyForDrive
);

// POST /api/student/resume/analyze
// Accepts multipart/form-data (field: "resume"), forwards the file to
// the Python AI microservice for structured parsing (skills, tools,
// projects, certifications) and returns the result.
router.post(
  '/resume/analyze',
  verifyTokenAndRole(['Student']),
  upload.single('resume'),
  analyzeResume
);

module.exports = router;
