const express = require('express');
const router = express.Router();
const { verifyTokenAndRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getDepartmentAnalytics,
  postDepartmentDrive
} = require('../controllers/departmentCoordinatorController');

const coordinatorOrAdmin = verifyTokenAndRole(['Department Placement Coordinator', 'Admin']);

router.get('/analytics', coordinatorOrAdmin, getDepartmentAnalytics);
router.post('/drive', coordinatorOrAdmin, upload.single('jdFile'), postDepartmentDrive);

module.exports = router;
