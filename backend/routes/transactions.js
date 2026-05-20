const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { fireWebhook } = require('../services/webhooks');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transactions ORDER BY occurred_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transactions WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { transaction_id, from_holder, to_holder, credits_amount, price_per_ton_usd, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO transactions (transaction_id, from_holder, to_holder, credits_amount, price_per_ton_usd, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [transaction_id, from_holder, to_holder, credits_amount, price_per_ton_usd || 0, status || 'pending', notes || '']
    );
    fireWebhook('transfer', result.rows[0]).catch(() => {});
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { transaction_id, from_holder, to_holder, credits_amount, price_per_ton_usd, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE transactions SET transaction_id=$1, from_holder=$2, to_holder=$3, credits_amount=$4,
         price_per_ton_usd=$5, status=$6, notes=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [transaction_id, from_holder, to_holder, credits_amount, price_per_ton_usd, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM transactions WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted', transaction: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
