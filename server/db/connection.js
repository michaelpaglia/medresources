// Database connection configuration
const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'medical_resource_finder',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// Export query function for use in other modules
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};