const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString && !process.env.DB_PASSWORD) {
  throw new Error('DATABASE_URL or DB_PASSWORD is required; no database password fallback is used');
}

const pool = new Pool(connectionString ? { connectionString } : {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'carbon_registry',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
