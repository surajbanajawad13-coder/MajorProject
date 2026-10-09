const express = require('express');
const mongoose = require('mongoose');
const studentController = require('../controllers/studentController');
const { verifyTokenAndRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();
const profileRoles = ['Student', 'Placement Officer', 'Department Placement Coordinator', 'Admin'];

router.get('/:id', verifyTokenAndRole(profileRoles), async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'A valid learner ID is required.' });
  }
  if (req.role === 'Student' && req.userId.toString() !== req.params.id) {
    return res.status(403).json({ success: false, message: 'You can only view your own profile.' });
  }
  req.userId = req.params.id;
  return studentController.getStudentProfile(req, res, next);
});

router.put('/:id', verifyTokenAndRole(['Student']), upload.single('resume'), (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id) || req.userId.toString() !== req.params.id) {
    return res.status(403).json({ success: false, message: 'You can only update your own profile.' });
  }
  req.userId = req.params.id;
  return studentController.updateStudentProfile(req, res, next);
});

module.exports = router;
