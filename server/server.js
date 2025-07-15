// Main server entry point for MockCRM
// Should:
// - Import express, cors, dotenv
// - Set up middleware (cors, json parsing)
// - Import and mount routes from /routes directory
// - Set up error handling middleware
// - Start server on specified port
// - Handle environment variables 
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Make pool available to middleware
app.locals.pool = pool;

// Middleware setup
app.use(cors());
app.use(express.json());

// Session middleware (must come before Passport)
const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

// Passport setup
const passport = require('passport');
require('./middleware/authMiddleware'); // Register the strategy

app.use(passport.initialize());
app.use(passport.session());

// Import routes
const dealsRoutes = require('./routes/deals');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

// Mount routes
app.use('/api/deals', dealsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MockCRM Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});