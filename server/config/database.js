// PostgreSQL database configuration using queries
// Should:
// - Use SQL queries
// - Set up connection pool settings
// - Handle connection errors and logging
// - Test database connection on startup
const {Pool }=require('pg');
require('dotenv').config();
// Database connection configuration
const pool = new Pool({
    user: process.env.DB_USER,       // Use environment variables
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 20,                         // max number of clients in the pool
    idleTimeoutMillis: 30000,       // how long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000,   // max amount of time to wait to connect to the database
  });

  // Test the database connection
async function testConnection() {
    try {
      const client = await pool.connect();
      console.log('Database connection successful');
      client.release(); // Release the connection back to the pool
    } catch (err) {
      console.error('Database connection error:', err);
    }
  }
  
  testConnection();
  
  module.exports = pool;