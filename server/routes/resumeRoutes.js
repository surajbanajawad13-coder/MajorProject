const express = require('express');
const { verifyTokenAndRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { analyzeResume } = require('../controllers/recommendationController');

const router = express.Router();
router.post('/upload', verifyTokenAndRole(['Student']), upload.single('resume'), analyzeResume);
router.post('/analyze', verifyTokenAndRole(['Student']), upload.single('resume'), analyzeResume);

module.exports = router;
