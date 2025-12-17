const { Pool } = require('pg');
require('dotenv').config();

// SSL is required for Neon (and most cloud providers)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for some hosts, though CA check is better in strict prod
  }
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Wrapper to standardise async queries (matches our previous API mostly)
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
};

// Polyfill for 'run' to ease migration, but throwing error to force refactor
// SQLite 'run' returned { id, changes }. Postgres returns rows.
// We should update call sites to use RETURNING id.
const run = async () => {
  throw new Error('pool.run() is deprecated in Postgres migration. Use pool.query() with RETURNING clause.');
};

// Init DB not needed for connection, but could run schema
const initDB = async () => {
  try {
    // Optional: Check connection
    await pool.query('SELECT 1');
    console.log('Database connection verified');
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
};

module.exports = {
  query,
  run, // Exporting dummy to catch legacy usage errors
  initDB,
  pool // Export raw pool if needed
};
