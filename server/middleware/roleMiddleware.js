// Middleware for checking authentication and roles

// Check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Check if user has admin role
const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
};

// Check if user is admin or owns the resource
const requireAdminOrOwnership = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  // For non-admin users, check if they own the resource
  // This will be implemented per-route based on the resource type
  next();
};

// Check if user can access a deal (admin or assigned to the deal)
const canAccessDeal = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  // For non-admin users, check if they are assigned to the deal
  const dealId = req.params.id;
  try {
    const result = await req.app.locals.pool.query(
      'SELECT * FROM deals WHERE id = $1 AND assigned_to = $2',
      [dealId, req.user.id]
    );
    
    if (result.rows.length > 0) {
      return next();
    } else {
      return res.status(403).json({ error: 'Access denied to this deal' });
    }
  } catch (error) {
    console.error('Error checking deal access:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireAdminOrOwnership,
  canAccessDeal
}; 