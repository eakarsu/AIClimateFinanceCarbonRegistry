const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// Fallback in-memory admin (used only if users table is missing or empty).
const FALLBACK_USER = {
  id: 1,
  email: 'registry@carbon.io',
  name: 'Registry Admin',
  role: 'admin',
  passwordHash: bcrypt.hashSync('carbon2026', 10),
};

async function findUserByEmail(email) {
  try {
    const r = await pool.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1', [email]);
    if (r.rows.length) {
      const u = r.rows[0];
      return { id: u.id, email: u.email, name: u.name, role: u.role, passwordHash: u.password_hash };
    }
  } catch (_) { /* table may not exist yet */ }
  if (email.toLowerCase() === FALLBACK_USER.email.toLowerCase()) return FALLBACK_USER;
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
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
