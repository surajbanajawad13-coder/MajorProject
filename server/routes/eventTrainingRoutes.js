const express = require('express');
const router = express.Router();
const { verifyTokenAndRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/eventTrainingController');

const coordinatorRoles = ['Event Coordinator', 'Admin'];
router.post('/', verifyTokenAndRole(coordinatorRoles), controller.createProgram);
router.get('/', verifyTokenAndRole(['Student', ...coordinatorRoles]), controller.getPrograms);
router.get('/analytics', verifyTokenAndRole(coordinatorRoles), controller.getAnalytics);
router.get('/:id', verifyTokenAndRole(['Student', ...coordinatorRoles]), controller.getProgram);
router.put('/:id', verifyTokenAndRole(coordinatorRoles), controller.updateProgram);
router.delete('/:id', verifyTokenAndRole(coordinatorRoles), controller.deleteProgram);
router.post('/:id/register', verifyTokenAndRole(['Student']), controller.registerStudent);

module.exports = router;
