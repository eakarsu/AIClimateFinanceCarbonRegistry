const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const pool = require('../config/database');
const { requireRole } = require('../middleware/rbac');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Configure which entity gets which columns (and what SQL to run).
const ENTITY_CONFIG = {
  projects: {
    table: 'projects',
    columns: ['project_id', 'name', 'type', 'country', 'hectares', 'status', 'description', 'developer'],
  },
  credits: {
    table: 'credits',
    columns: ['credit_id', 'project', 'vintage_year', 'tons_co2e', 'status', 'methodology', 'serial_number'],
  },
  transactions: {
    table: 'transactions',
    columns: ['transaction_id', 'from_holder', 'to_holder', 'credits_amount', 'price_per_ton_usd', 'status', 'notes'],
  },
};

function coerce(col, val) {
  if (val === '' || val === undefined || val === null) return null;
  if (['hectares', 'vintage_year', 'tons_co2e', 'credits_amount', 'price_per_ton_usd'].includes(col)) {
    const n = Number(val);
    return isNaN(n) ? null : n;
  }
  return val;
}

// POST /api/bulk-import/:entity
router.post('/:entity', requireRole('admin', 'registrar'), upload.single('file'), async (req, res) => {
  try {
    const cfg = ENTITY_CONFIG[req.params.entity];
    if (!cfg) return res.status(400).json({ error: `Unknown entity '${req.params.entity}'. Supported: ${Object.keys(ENTITY_CONFIG).join(', ')}` });
    if (!req.file) return res.status(400).json({ error: 'file is required (form field "file")' });

    let records;
    try {
      records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
    } catch (e) {
      return res.status(400).json({ error: 'CSV parse failed: ' + e.message });
    }

    const placeholders = cfg.columns.map((_, i) => `$${i + 1}`).join(',');
    const sql = `INSERT INTO ${cfg.table} (${cfg.columns.join(',')}) VALUES (${placeholders}) RETURNING id`;

    let inserted = 0;
    let failed = 0;
    const errors = [];
    for (const row of records) {
      const values = cfg.columns.map((c) => coerce(c, row[c]));
      try {
        await pool.query(sql, values);
        inserted++;
      } catch (e) {
        failed++;
        errors.push({ row, error: e.message });
        if (errors.length > 25) break;
      }
    }
    res.status(201).json({ entity: req.params.entity, inserted, failed, errors });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
