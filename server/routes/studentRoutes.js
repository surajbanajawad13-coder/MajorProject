const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController.js');
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

module.exports = router;
