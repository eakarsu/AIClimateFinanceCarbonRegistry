'use strict';
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function main() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  const tenantId = String(process.env.ADMIN_TENANT_ID || process.env.TENANT_ID || '').trim();
  const name = String(process.env.ADMIN_NAME || 'Registry Administrator').trim();
  if (!email || !tenantId || password.length < 14) {
    throw new Error('ADMIN_EMAIL, ADMIN_TENANT_ID and ADMIN_PASSWORD (14+ characters) are required');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users(email, name, password_hash, role, tenant_id)
     VALUES ($1,$2,$3,'admin',$4)
     ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, password_hash=EXCLUDED.password_hash,
       role='admin', tenant_id=EXCLUDED.tenant_id`,
    [email, name, passwordHash, tenantId]
  );
  console.log(`Administrator provisioned for tenant ${tenantId}`);
  await pool.end();
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
