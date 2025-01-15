const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
// middleware/middleware.js

const isAuthenticated = (req, res, next) => {
  // Check if token is sent in the cookies or in the Authorization header
  const token = req.cookies.auth_token || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
      }
      req.user = decoded;  // Attach user data to the request
      next();  // Proceed to the next middleware or route handler
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { isAuthenticated };
