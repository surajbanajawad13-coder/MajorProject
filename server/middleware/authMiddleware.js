const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

  try {

    const token =
      req.headers.authorization.split(' ')[1];

    const decodedData = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = decodedData.id;
    req.role = decodedData.role;

    next();

  } catch (error) {

    return res.status(401).json({
      message: 'Unauthorized',
    });
  }
};