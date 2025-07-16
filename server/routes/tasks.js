const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, requireAdmin, canAccessTask } = require('../middleware/roleMiddleware');

// GET all tasks for the user's account
router.get('/', requireAuth, async (req, res) => {
  try {
    let query = `SELECT t.*, d.name as deal_name, u.name as user_name
                 FROM tasks t
                 JOIN deals d ON t.deal_id = d.id
                 LEFT JOIN users u ON t.user_id = u.id
                 WHERE d.account_id = $1`;
    let params = [req.user.account_id];

    // If user is not admin, only show their tasks
    if (req.user.role !== 'admin') {
      query += ' AND t.user_id = $2';
      params.push(req.user.id);
    }

    // Add filtering by status if provided
    if (req.query.status) {
      query += ` AND t.status = $${params.length + 1}`;
      params.push(req.query.status);
    }

    query += ' ORDER BY t.due_date ASC, t.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET single task
router.get('/:id', requireAuth, canAccessTask, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT t.*, d.name as deal_name, u.name as user_name
       FROM tasks t
       JOIN deals d ON t.deal_id = d.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = $1 AND d.account_id = $2`,
      [id, req.user.account_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST new task
router.post('/', requireAuth, async (req, res) => {
  try {
    const { deal_id, user_id, name, due_date, status } = req.body;
    
    // Verify the deal belongs to the user's account
    const dealCheck = await pool.query(
      'SELECT id FROM deals WHERE id = $1 AND account_id = $2',
      [deal_id, req.user.account_id]
    );
    
    if (dealCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid deal ID' });
    }

    const result = await pool.query(
      'INSERT INTO tasks (deal_id, user_id, name, due_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [deal_id, user_id, name, due_date, status || 'todo']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// PUT update task
router.put('/:id', requireAuth, canAccessTask, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, due_date, status, user_id } = req.body;
    
    const result = await pool.query(
      'UPDATE tasks SET name = $1, due_date = $2, status = $3, user_id = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, due_date, status, user_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// DELETE task (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM tasks WHERE id = $1 AND deal_id IN (
        SELECT id FROM deals WHERE account_id = $2
      ) RETURNING *`,
      [id, req.user.account_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router; 