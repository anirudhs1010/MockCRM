// Deals API routes
// Should define:
// - GET /api/deals - Get deals with role-based filtering and query params (stage, outcome)
// - GET /api/deals/:id - Get single deal with ownership check
// - POST /api/deals - Create new deal (admin or self-assignment)
// - PUT /api/deals/:id - Update deal with ownership/role validation
// - DELETE /api/deals/:id - Delete deal (admin only)
// - Apply auth middleware for all routes
// - Apply role-based middleware where needed 

//intialize express router
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAdmin, canAccessDeal } = require('../middleware/roleMiddleware');
const { requireAuth } = require('../middleware/jwtMiddleware');

// GET all deals (filtered by account and role)
router.get('/', requireAuth, async (req, res) => {
  try {
    let query = `SELECT d.*, s.name as stage_name, u.name as user_name, c.name as customer_name
                 FROM deals d
                 LEFT JOIN stages s ON d.stage_id = s.id
                 LEFT JOIN users u ON d.user_id = u.id
                 LEFT JOIN customers c ON d.customer_id = c.id
                 WHERE d.account_id = $1`;
    let params = [req.user.account_id];

    // If user is not admin, only show their deals
    if (req.user.role !== 'admin') {
      query += ' AND d.user_id = $2';
      params.push(req.user.id);
    }

    // Add filtering by stage and outcome if provided
    if (req.query.stage) { 
      params.push(req.query.stage);
      query += ` AND s.name = $${params.length}`;
      
    }
    if (req.query.outcome) {
      query += ` AND d.outcome = $${params.length + 1}`;
      params.push(req.query.outcome);
    }
    
    query += ' ORDER BY d.created_at DESC';
    // console.log(query);
    // console.log(JSON.stringify(params));
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET single deal
router.get('/:id', requireAuth, canAccessDeal, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT d.*, s.name as stage_name, u.name as user_name, c.name as customer_name
       FROM deals d
       LEFT JOIN stages s ON d.stage_id = s.id
       LEFT JOIN users u ON d.user_id = u.id
       LEFT JOIN customers c ON d.customer_id = c.id
       WHERE d.id = $1 AND d.account_id = $2`,
      [id, req.user.account_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST new deal (admin or self-assignment)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, amount, stage_id, outcome, customer_id } = req.body;
    const userId = req.user.id;
    const accountId = req.user.account_id;
    const result = await pool.query(
      'INSERT INTO deals (account_id, user_id, customer_id, stage_id, name, amount, outcome) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [accountId, userId, customer_id, stage_id, name, amount, outcome]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// PUT update deal
router.put('/:id', requireAuth, canAccessDeal, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, stage_id, outcome, customer_id } = req.body;
    const result = await pool.query(
      'UPDATE deals SET name = $1, amount = $2, stage_id = $3, outcome = $4, customer_id = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND account_id = $7 RETURNING *',
      [name, amount, stage_id, outcome, customer_id, id, req.user.account_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// DELETE deal (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Always allow deleting any deal regardless of account_id (development behavior in production)
    const result = await pool.query(
      'DELETE FROM deals WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json({ message: 'Deal deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;