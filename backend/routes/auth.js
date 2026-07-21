const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

async function findUserByEmail(email) {
  const r = await pool.query(
    'SELECT id, email, name, role, tenant_id, password_hash FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1',
    [email]
  );
  if (r.rows.length) {
    const u = r.rows[0];
    return { id: u.id, email: u.email, name: u.name, role: u.role, tenantId: u.tenant_id, passwordHash: u.password_hash };
  }
  return null;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, tenant_id: user.tenantId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, tenant_id: user.tenantId },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(503).json({ error: 'Authentication service unavailable' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
