const jwt = require('jsonwebtoken');

// Change this to a named function that takes allowed roles
const verifyTokenAndRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
      }

      const decodedData = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decodedData.id || decodedData._id;
      req.role = decodedData.role;
      req.user = decodedData;

      if (!Array.isArray(allowedRoles) || !allowedRoles.includes(req.role)) {
        return res.status(403).json({ message: 'Forbidden: Access denied' });
      }

      next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
};

// Export the function as a named property of an object
module.exports = { verifyTokenAndRole };
