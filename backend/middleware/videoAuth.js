const jwt = require('jsonwebtoken');

// Middleware to protect video routes
const protectVideo = (req, res, next) => {
  try {
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).send('Unauthorized: No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).send('Unauthorized: Invalid token');
  }
};

module.exports = { protectVideo };
