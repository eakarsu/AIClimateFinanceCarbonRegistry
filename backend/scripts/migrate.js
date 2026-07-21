'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const pool = require('../config/database');

async function main() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [3051004]);
    await client.query(`CREATE TABLE IF NOT EXISTS app_schema_migrations (
      filename TEXT PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const directory = path.join(__dirname, '..', 'migrations');
    for (const filename of fs.readdirSync(directory).filter((name) => name.endsWith('.sql')).sort()) {
      const sql = fs.readFileSync(path.join(directory, filename), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const existing = await client.query('SELECT checksum FROM app_schema_migrations WHERE filename=$1', [filename]);
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${filename}`);
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO app_schema_migrations(filename, checksum) VALUES ($1,$2)', [filename, checksum]);
        await client.query('COMMIT');
        console.log(`Applied ${filename}`);
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [3051004]).catch(() => {});
    client.release();
    await pool.end();
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
