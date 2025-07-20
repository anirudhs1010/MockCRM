const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken, requireAuth, requireAdmin } = require('../middleware/jwtMiddleware');

// Apply JWT authentication and admin-only middleware to all routes
router.use(verifyToken, requireAdmin);

// GET all deal stages
router.get('/stages', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM stages ORDER BY order_index',
      []
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST new deal stage
router.post('/stages', async (req, res) => {
  try {
    const { name, description, order_index } = req.body;
    const result = await pool.query(
      'INSERT INTO stages (name, description, order_index) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, order_index || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// PUT update deal stage
router.put('/stages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, order_index } = req.body;
    
    const result = await pool.query(
      'UPDATE stages SET name = $1, description = $2, order_index = $3 WHERE id = $4 RETURNING *',
      [name, description || null, order_index || 0, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deal stage not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// DELETE deal stage
router.delete('/stages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM stages WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deal stage not found' });
    }
    
    res.json({ message: 'Deal stage deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET all users in the account
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE account_id = $1 ORDER BY created_at DESC',
      [req.user.account_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST new user (invite to account)
router.post('/users', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // For now, create a placeholder user that can be activated later
    // In a real app, you'd send an invitation email and they'd authenticate via Okta
    // Generate a temporary okta_id for placeholder users
    const tempOktaId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await pool.query(
      'INSERT INTO users (account_id, okta_id, name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, created_at',
      [req.user.account_id, tempOktaId, name, email, role || 'sales_rep']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// PUT update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 AND account_id = $5 RETURNING id, name, email, role, created_at',
      [name, email, role, id, req.user.account_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router; 