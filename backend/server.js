const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });

const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 3041;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3040,http://localhost:3050,http://localhost:3000,http://localhost:5173')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, true); // permissive in dev
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (public)
app.use('/api/auth', require('./routes/auth'));

// Gate all other /api/* with JWT
app.use('/api', authenticateToken);

// CRUD routes — original 8
app.use('/api/projects', require('./routes/projects'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/holders', require('./routes/holders'));
app.use('/api/verifiers', require('./routes/verifiers'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/audits', require('./routes/audits'));
app.use('/api/methodologies', require('./routes/methodologies'));
app.use('/api/issuances', require('./routes/issuances'));

// CRUD routes — 10 new
app.use('/api/retirements', require('./routes/retirements'));
app.use('/api/beneficiaries', require('./routes/beneficiaries'));
app.use('/api/scopes-emissions', require('./routes/scopes-emissions'));
app.use('/api/scoreboard', require('./routes/scoreboard'));
app.use('/api/jurisdictional-baselines', require('./routes/jurisdictional-baselines'));
app.use('/api/satellite-imagery', require('./routes/satellite-imagery'));
app.use('/api/smr-reports', require('./routes/smr-reports'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/biodiversity-cobenefits', require('./routes/biodiversity-cobenefits'));
app.use('/api/finance-ledger', require('./routes/finance-ledger'));

// Cross-cutting
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments', require('./routes/attachments'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/bulk-import', require('./routes/bulk-import'));

// AI routes
app.use('/api/ai', require('./routes/ai'));

// Dashboard stats
app.use('/api/dashboard', require('./routes/dashboard'));

// Custom Climate Views (4 features) — must mount BEFORE the 404 handler
app.use('/api/custom-views', require('./routes/customViews'));

// 404 for unknown /api/* routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not_found', path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`\nCarbon Registry API running on http://localhost:${PORT}\n`);
});
