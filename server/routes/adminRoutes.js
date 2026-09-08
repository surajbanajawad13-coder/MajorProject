/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Routes: /api/admin
 * Purpose: User management + summary stats for the Administrator dashboard.
 *          All routes here are Admin-only.
 *
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyTokenAndRole } = require('../middleware/authMiddleware');

router.use(verifyTokenAndRole(['Admin']));

router.get('/summary', adminController.getAdminSummary);
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
