const express = require('express');
const router = express.Router();
const { login, signup } = require('../controllers/authController');

exports.authorizeRoles =
  (...roles) => {
    return (req, res, next) => {
      if (
        !roles.includes(req.role)
      ) {
        return res.status(403).json({
          message:
            'Access denied',
        });
      }
      next();
    };
  };

// POST: /api/auth/login
router.post('/login', login);
router.post('/signup', signup);

module.exports = router;