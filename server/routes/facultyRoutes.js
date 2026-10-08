const express = require('express');
const facultyController = require('../controllers/facultyController');
const { verifyTokenAndRole } = require('../middleware/authMiddleware');

const router = express.Router();
const facultyOnly = verifyTokenAndRole(['Faculty']);

router.get('/dashboard', facultyOnly, facultyController.getDashboard);
router.get('/students', facultyOnly, facultyController.getStudents);
router.put('/students/:studentId/mentor', facultyOnly, facultyController.updateMentorship);

module.exports = router;
