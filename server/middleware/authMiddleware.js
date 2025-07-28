// This file is kept for compatibility but has been replaced by JWT authentication
// The application now uses JWT-based authentication with custom email/password system

const pool = require('../config/database');

// Placeholder middleware - actual authentication is handled by jwtMiddleware.js
const requireAuth = (req, res, next) => {
  // This middleware is deprecated - use jwtMiddleware.js instead
  return res.status(500).json({ error: 'Use JWT authentication middleware instead' });
};

module.exports = {
  requireAuth
}; 