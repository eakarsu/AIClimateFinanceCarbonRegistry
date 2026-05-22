// Public routes — no JWT required.
// Mounted at /api/public/* BEFORE the global JWT gate in server.js.
//
// Pass 7: backlog implementation.
//   - GET /api/public/retirements/:serial — public retirement certificate lookup.
//   - GET /api/public/retirements/search?beneficiary=... — public beneficiary search.

const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// GET /api/public/retirements/:serial — public retirement certificate lookup
// Returns a sanitized public-facing retirement record (no internal IDs / metadata).
router.get('/retirements/:serial', async (req, res) => {
  try {
    const serial = String(req.params.serial || '').trim();
    if (!serial) return res.status(400).json({ error: 'serial is required' });
    const r = await pool.query(
      `SELECT retirement_id, credits_amount, beneficiary, claim, retired_at, certificate_url
         FROM retirements
        WHERE retirement_id = $1
        LIMIT 1`,
      [serial]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'retirement_not_found', serial });
    const row = r.rows[0];
    res.json({
      retirement_id: row.retirement_id,
      credits_amount: row.credits_amount,
      beneficiary: row.beneficiary,
      claim: row.claim,
      retired_at: row.retired_at,
      certificate_url: row.certificate_url,
      public_lookup: true,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/public/retirements/search?beneficiary=... — public beneficiary search
router.get('/retirements', async (req, res) => {
  try {
    const beneficiary = String(req.query.beneficiary || '').trim();
    const limit = Math.min(Number(req.query.limit) || 25, 100);
    let r;
    if (beneficiary) {
      r = await pool.query(
        `SELECT retirement_id, credits_amount, beneficiary, claim, retired_at, certificate_url
           FROM retirements
          WHERE beneficiary ILIKE $1
          ORDER BY retired_at DESC
          LIMIT $2`,
        [`%${beneficiary}%`, limit]
      );
    } else {
      r = await pool.query(
        `SELECT retirement_id, credits_amount, beneficiary, claim, retired_at, certificate_url
           FROM retirements
          ORDER BY retired_at DESC
          LIMIT $1`,
        [limit]
      );
    }
    res.json({ count: r.rows.length, results: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/public/issuance-chain — read-only hash-chain head for issuance ledger
// NEEDS-PRODUCT-DECISION shipped as append-only hash-chain over issuances.
router.get('/issuance-chain', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT issuance_id, project, vintage_year, tons_issued, methodology, issued_at, prev_hash, hash
         FROM issuance_hash_chain
         ORDER BY id ASC`
    );
    res.json({
      length: r.rows.length,
      head: r.rows.length ? r.rows[r.rows.length - 1].hash : null,
      chain: r.rows,
    });
  } catch (err) {
    // Table may not exist if migration not applied — degrade gracefully.
    res.json({ length: 0, head: null, chain: [], note: 'issuance_hash_chain not yet populated' });
  }
});

module.exports = router;
