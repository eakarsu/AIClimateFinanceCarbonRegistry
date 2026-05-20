const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM verifiers ORDER BY verification_count DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM verifiers WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Verifier not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { verifier_id, name, accreditation, verification_count, last_audit_at, status, country } = req.body;
    const result = await pool.query(
      `INSERT INTO verifiers (verifier_id, name, accreditation, verification_count, last_audit_at, status, country)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [verifier_id, name, accreditation, verification_count || 0, last_audit_at || null, status || 'active', country || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { verifier_id, name, accreditation, verification_count, last_audit_at, status, country } = req.body;
    const result = await pool.query(
      `UPDATE verifiers SET verifier_id=$1, name=$2, accreditation=$3, verification_count=$4,
         last_audit_at=$5, status=$6, country=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [verifier_id, name, accreditation, verification_count, last_audit_at, status, country, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Verifier not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM verifiers WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Verifier not found' });
    res.json({ message: 'Verifier deleted', verifier: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
