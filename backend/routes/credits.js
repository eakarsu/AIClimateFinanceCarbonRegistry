const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM credits ORDER BY issued_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM credits WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Credit not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { credit_id, project, vintage_year, tons_co2e, status, methodology, serial_number } = req.body;
    const result = await pool.query(
      `INSERT INTO credits (credit_id, project, vintage_year, tons_co2e, status, methodology, serial_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [credit_id, project, vintage_year, tons_co2e, status || 'issued', methodology, serial_number || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { credit_id, project, vintage_year, tons_co2e, status, methodology, serial_number } = req.body;
    const result = await pool.query(
      `UPDATE credits SET credit_id=$1, project=$2, vintage_year=$3, tons_co2e=$4,
         status=$5, methodology=$6, serial_number=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [credit_id, project, vintage_year, tons_co2e, status, methodology, serial_number, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Credit not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM credits WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Credit not found' });
    res.json({ message: 'Credit deleted', credit: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
