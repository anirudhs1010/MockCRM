const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const pool = require('../config/database');

// Initialize JWKS client for Okta
const client = jwksClient({
  jwksUri: `https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/keys`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

// Get signing key from Okta
const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  jwt.verify(token, getKey, {
    issuer: `https://${process.env.OKTA_DOMAIN}/oauth2/default`,
    algorithms: ['RS256']
  }, async (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }

    try {
      console.log('Looking for user with okta_id:', `okta_${decoded.sub}`);
      // Check if user exists in database
      const userResult = await pool.query(
        'SELECT * FROM users WHERE okta_id = $1',
        [`okta_${decoded.sub}`]
      );
      console.log('User lookup result:', userResult.rows);

      if (userResult.rows.length > 0) {
        req.user = userResult.rows[0];
        return next();
      } else {
        // Create new user if they don't exist
        let accountId;
        
        // Extract name from email or use a default
        const emailName = decoded.sub.split('@')[0];
        const displayName = decoded.name || emailName;
        
        // Create a new account for the user
        const accountResult = await pool.query(
          'INSERT INTO accounts (name) VALUES ($1) RETURNING id',
          [`${displayName}'s Account`]
        );
        accountId = accountResult.rows[0].id;

        // Create new user with account_id - use sales_rep as default role per schema
        const newUserResult = await pool.query(
          'INSERT INTO users (account_id, okta_id, name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [accountId, `okta_${decoded.sub}`, displayName, decoded.sub, 'sales_rep']
        );
        
        req.user = newUserResult.rows[0];
        return next();
      }
    } catch (error) {
      console.error('Database error during authentication:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  });
};

// Check if user has admin role
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
};

// Check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.user) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

module.exports = {
  verifyToken,
  requireAuth,
  requireAdmin
}; 