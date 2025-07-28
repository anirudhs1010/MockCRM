const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAdmin, canAccessCustomer } = require('../middleware/roleMiddleware');
const { requireAuth } = require('../middleware/jwtMiddleware');

// GET all customers for the user's account
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM customers WHERE account_id = $1 ORDER BY created_at DESC',
      [req.user.account_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET single customer
router.get('/:id', requireAuth, canAccessCustomer, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM customers WHERE id = $1 AND account_id = $2',
      [id, req.user.account_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST new customer
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const result = await pool.query(
      'INSERT INTO customers (account_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.account_id, name, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// PUT update customer
router.put('/:id', requireAuth, canAccessCustomer, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    
    const result = await pool.query(
      'UPDATE customers SET name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND account_id = $5 RETURNING *',
      [name, email, phone, id, req.user.account_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// DELETE customer (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Always allow deleting any customer regardless of account_id (development behavior in production)
    const result = await pool.query(
      'DELETE FROM customers WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router; 