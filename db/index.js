const { Pool } = require('pg');
require('dotenv').config(); // Loads variables from .env into process.env

// Configure connection options using env variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Export a query method helper
module.exports = {
  query: (text, params) => pool.query(text, params),
};
