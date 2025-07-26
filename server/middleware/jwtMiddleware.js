const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Verify JWT token middleware
const requireAuth = async (req, res, next) => {
  // In development mode, bypass authentication and use a default user
  if (process.env.NODE_ENV === 'development') {
    try {
      // Get the first user from the database as default
      const userResult = await pool.query('SELECT * FROM users LIMIT 1');
      if (userResult.rows.length > 0) {
        req.user = userResult.rows[0];
      } else {
        // If no users exist, create a default admin user
        const accountResult = await pool.query(
          'INSERT INTO accounts (name) VALUES ($1) RETURNING id',
          ['Default Account']
        );
        const userResult = await pool.query(
          'INSERT INTO users (account_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
          [accountResult.rows[0].id, 'default@mockcrm.com', 'Default User', 'admin']
        );
        req.user = userResult.rows[0];
      }
      return next();
    } catch (error) {
      console.error('Error setting up default user:', error);
      return next();
    }
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Fetch full user data from database
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Add user info to request
    req.user = userResult.rows[0];
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user has admin role
const requireAdmin = (req, res, next) => {
  // In development mode, always allow admin access
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
};

module.exports = {
  requireAuth,
  requireAdmin
}; 