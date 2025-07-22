// Middleware for checking authentication and roles
const pool = require('../config/database');

// Check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.user) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Check if user has admin role
const requireAdmin = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    // Always allow admin access in dev
    return next();
  }
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
};

// Check if user is admin or owns the resource
const requireAdminOrOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  // For non-admin users, check if they own the resource
  // This will be implemented per-route based on the resource type
  next();
};

// Check if user can access a deal (admin or creator of the deal)
const canAccessDeal = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  // For non-admin users, check if they created the deal
  const dealId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM deals WHERE id = $1 AND user_id = $2 AND account_id = $3',
      [dealId, req.user.id, req.user.account_id]
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

// Check if user can access a customer (admin or customer belongs to same account)
const canAccessCustomer = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  // For non-admin users, check if customer belongs to their account
  const customerId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM customers WHERE id = $1 AND account_id = $2',
      [customerId, req.user.account_id]
    );
    
    if (result.rows.length > 0) {
      return next();
    } else {
      return res.status(403).json({ error: 'Access denied to this customer' });
    }
  } catch (error) {
    console.error('Error checking customer access:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Check if user can access a task (admin or assigned to the task)
const canAccessTask = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  // For non-admin users, check if they are assigned to the task
  const taskId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT t.* FROM tasks t JOIN deals d ON t.deal_id = d.id WHERE t.id = $1 AND t.user_id = $2 AND d.account_id = $3',
      [taskId, req.user.id, req.user.account_id]
    );
    
    if (result.rows.length > 0) {
      return next();
    } else {
      return res.status(403).json({ error: 'Access denied to this task' });
    }
  } catch (error) {
    console.error('Error checking task access:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireAdminOrOwnership,
  canAccessDeal,
  canAccessCustomer,
  canAccessTask
}; 