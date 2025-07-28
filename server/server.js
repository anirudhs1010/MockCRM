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

// Load environment variables from root directory
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Make pool available to middleware
app.locals.pool = pool;

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json());

// Import routes
const dealsRoutes = require('./routes/deals');
const customersRoutes = require('./routes/customers');
const tasksRoutes = require('./routes/tasks');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

// Mount routes
app.use('/api/deals', dealsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/tasks', tasksRoutes);
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
  // console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});