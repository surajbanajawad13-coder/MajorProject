const express = require('express');
const { verifyTokenAndRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/careerGuidanceController');

const router = express.Router();
const permittedRoles = ['Student', 'Placement Officer', 'Department Placement Coordinator', 'Admin'];

router.get('/career-guidance/:userId', verifyTokenAndRole(permittedRoles), controller.getCareerGuidance);
router.get('/skill-gap/:userId', verifyTokenAndRole(permittedRoles), controller.getSkillGap);

module.exports = router;
