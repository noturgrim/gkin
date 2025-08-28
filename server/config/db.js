const { Pool } = require('pg');
const config = require('./config');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://gkindatabase_user:J00pVTWpwqb5f8t8VyK0I2IibiBds8Ri@dpg-d2niaif5r7bs73fl1c9g-a.oregon-postgres.render.com/gkindatabase',
  ssl: {
    rejectUnauthorized: false // Required for some hosting providers like Render
  }
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  getClient: async () => await pool.connect()
};
