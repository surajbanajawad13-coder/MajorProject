const jwt = require('jsonwebtoken');

// Change this to a named function that takes allowed roles
const verifyTokenAndRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // 1. Extract the token from the Authorization header
      const token = req.headers.authorization.split(' ')[1];
      
      // 2. Verify the JWT token
      const decodedData = jwt.verify(token, process.env.JWT_SECRET);
      
      // 3. Attach user data to the request object
     req.userId = decodedData.id || decodedData._id;
    req.role = decodedData.role;

      // 4. Check if the user's role is permitted
      if (!allowedRoles.includes(req.role)) {
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
