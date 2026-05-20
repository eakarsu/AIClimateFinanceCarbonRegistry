const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/stats', async (req, res) => {
  try {
    const tableCount = (t) => pool.query(`SELECT COUNT(*)::int AS total FROM ${t}`);
    const queries = await Promise.all([
      tableCount('projects'),
      tableCount('credits'),
      pool.query('SELECT COALESCE(SUM(tons_co2e),0)::bigint AS total_tons FROM credits'),
      tableCount('holders'),
      tableCount('verifiers'),
      tableCount('transactions'),
      tableCount('audits'),
      tableCount('methodologies'),
      tableCount('issuances'),
      pool.query("SELECT COUNT(*)::int AS total FROM credits WHERE status='retired'"),
      pool.query("SELECT COALESCE(AVG(price_per_ton_usd),0)::numeric(10,2) AS avg_price FROM transactions WHERE status='settled'"),
      pool.query("SELECT COUNT(*)::int AS total FROM audits WHERE finding='major-finding'"),
      // New entities
      tableCount('retirements'),
      tableCount('beneficiaries'),
      tableCount('scopes_emissions'),
      tableCount('scoreboard'),
      tableCount('jurisdictional_baselines'),
      tableCount('satellite_imagery'),
      tableCount('smr_reports'),
      tableCount('claims'),
      tableCount('biodiversity_cobenefits'),
      tableCount('finance_ledger'),
      pool.query('SELECT COUNT(*)::int AS total FROM notifications WHERE read=false'),
    ]);

    res.json({
      projects: queries[0].rows[0].total,
      credits: queries[1].rows[0].total,
      total_tons_co2e: Number(queries[2].rows[0].total_tons),
      holders: queries[3].rows[0].total,
      verifiers: queries[4].rows[0].total,
      transactions: queries[5].rows[0].total,
      audits: queries[6].rows[0].total,
      methodologies: queries[7].rows[0].total,
      issuances: queries[8].rows[0].total,
      retired_credits: queries[9].rows[0].total,
      avg_price_usd_per_ton: Number(queries[10].rows[0].avg_price),
      major_findings: queries[11].rows[0].total,
      retirements: queries[12].rows[0].total,
      beneficiaries: queries[13].rows[0].total,
      scopes_emissions: queries[14].rows[0].total,
      scoreboard: queries[15].rows[0].total,
      jurisdictional_baselines: queries[16].rows[0].total,
      satellite_imagery: queries[17].rows[0].total,
      smr_reports: queries[18].rows[0].total,
      claims: queries[19].rows[0].total,
      biodiversity_cobenefits: queries[20].rows[0].total,
      finance_ledger: queries[21].rows[0].total,
      unread_notifications: queries[22].rows[0].total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
