// Deals API routes
// Should define:
// - GET /api/deals - Get deals with role-based filtering and query params (stage, outcome)
// - GET /api/deals/:id - Get single deal with ownership check
// - POST /api/deals - Create new deal (admin or self-assignment)
// - PUT /api/deals/:id - Update deal with ownership/role validation
// - DELETE /api/deals/:id - Delete deal (admin only)
// - Apply auth middleware for all routes
// - Apply role-based middleware where needed 
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM deals');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;