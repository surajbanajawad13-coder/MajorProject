const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController.js');

// This import statement will now work perfectly
const { verifyTokenAndRole } = require('../middleware/authMiddleware.js');

// Routes accessible by authenticated Students
router.get(
  '/dashboard', 
  verifyTokenAndRole(['Student']), 
  studentController.getStudentDashboard
);

router.put(
  '/profile', 
  verifyTokenAndRole(['Student']), 
  studentController.updateStudentProfile
);

module.exports = router;
