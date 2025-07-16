const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/roleMiddleware');

// Apply admin-only middleware to all routes
router.use(requireAuth, requireAdmin);

// GET all deal stages
router.get('/stages', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM deal_stages WHERE account_id = $1 ORDER BY order_index',
      [req.user.account_id]
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
    const { name, order_index } = req.body;
    const result = await pool.query(
      'INSERT INTO deal_stages (account_id, name, order_index) VALUES ($1, $2, $3) RETURNING *',
      [req.user.account_id, name, order_index]
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
    const { name, order_index } = req.body;
    
    const result = await pool.query(
      'UPDATE deal_stages SET name = $1, order_index = $2 WHERE id = $3 AND account_id = $4 RETURNING *',
      [name, order_index, id, req.user.account_id]
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
      'DELETE FROM deal_stages WHERE id = $1 AND account_id = $2 RETURNING *',
      [id, req.user.account_id]
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
    // In a real app, you'd send an invitation email
    const result = await pool.query(
      'INSERT INTO users (account_id, name, email, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [req.user.account_id, name, email, role || 'sales_rep']
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