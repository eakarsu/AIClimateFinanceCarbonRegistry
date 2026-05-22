const express = require('express');
const router = express.Router();

router.post('/draft', (req, res) => {
  const body = req.body || {};
  const tonnes = Number(body.tonnes || 0);
  const beneficiary = body.beneficiary || 'Beneficiary';
  const vintage = body.vintage || new Date().getFullYear();
  res.json({
    certificate_id: `RET-${Date.now()}`,
    title: `${beneficiary} carbon retirement certificate`,
    summary: `${beneficiary} retired ${tonnes.toLocaleString()} tCO2e from ${body.project || 'verified climate project'} vintage ${vintage}.`,
    claims_language: [
      'Retirement claim is limited to the stated tonnes and vintage.',
      'Do not reuse retired serials for offsetting or resale.',
      'Attach registry serial evidence before publication.',
    ],
    impact_equivalents: {
      passenger_vehicle_years: Number((tonnes / 4.6).toFixed(1)),
      tree_seedlings_10_years: Math.round(tonnes * 16.5),
    },
    generated_at: new Date().toISOString(),
  });
});

module.exports = router;
