const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { requireAuth } = require('../middleware/jwtMiddleware');

const router = express.Router();

// Register new user - only if they already exist in database without password
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user exists in database
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length === 0) {
      return res.status(403).json({ error: 'You must be invited by an administrator to register. Please contact an administrator.' });
    }

    const user = existingUser.rows[0];

    // Check if user already has a password set
    if (user.password_hash) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with password and name
    const userResult = await pool.query(
      'UPDATE users SET password_hash = $1, name = $2 WHERE email = $3 RETURNING id, email, name, role',
      [hashedPassword, name, email]
    );

    const updatedUser = userResult.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Admin-only user creation endpoint (creates user without password)
router.post('/admin/create-user', requireAuth, async (req, res) => {
  try {
    // Check if the authenticated user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can create new users' });
    }

    const { email, name, role = 'sales_rep' } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Validate role
    if (!['admin', 'sales_rep'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be either "admin" or "sales_rep"' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create account for the user
    const accountResult = await pool.query(
      'INSERT INTO accounts (name) VALUES ($1) RETURNING id',
      [`${name}'s Account`]
    );
    const accountId = accountResult.rows[0].id;

    // Create user without password (they will set it during registration)
    const userResult = await pool.query(
      'INSERT INTO users (account_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [accountId, email, name, role]
    );

    const user = userResult.rows[0];

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      message: 'User invited successfully. They can now register with their email.'
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'User creation failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Check if user has a password hash
    if (!user.password_hash) {
      return res.status(401).json({ 
        error: 'User account not properly configured. Please contact an administrator to set up your password.' 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token
router.get('/verify', requireAuth, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json(userResult.rows[0]);
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

// Logout user
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // In a more sophisticated system, you might want to blacklist the token
    // For now, we'll just return success - the client will remove the token
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Admin-only user deletion endpoint
router.delete('/admin/users/:userId', requireAuth, async (req, res) => {
  try {
    // Check if the authenticated user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can delete users' });
    }

    const { userId } = req.params;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userToDelete = existingUser.rows[0];

    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Delete user (this will cascade to related data if foreign key constraints are set up)
    await pool.query(
      'DELETE FROM users WHERE id = $1',
      [userId]
    );

    res.json({ 
      message: `User ${userToDelete.email} has been deleted successfully` 
    });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'User deletion failed' });
  }
});

module.exports = router; 