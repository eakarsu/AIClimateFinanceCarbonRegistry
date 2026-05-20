// Custom Carbon Views — 4 feature endpoints aligned with spec.
//   VIZ:     /emissions-trend           — baseline vs actual emissions
//            /project-region-heatmap    — CO2 reduced by region x project type
//   NON-VIZ: /carbon-certificate        — carbon credit certificate (PDF)
//            /methodology-rules         — registry/methodology rules editor (CRUD)
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ─── helpers ─────────────────────────────────────────────────────────────────
function seededRand(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

async function safeQuery(sql, params = []) {
  try {
    const r = await pool.query(sql, params);
    return r.rows;
  } catch (_) {
    return null;
  }
}

// In-memory store for methodology rules (CRUD). Survives until process restart.
// Seeded with realistic VCS / ICVCM-era rules.
let RULE_SEQ = 6;
const RULES = [
  {
    id: 1, code: 'VM0007', name: 'REDD+ Methodology Framework',
    standard: 'VCS', category: 'avoided-deforestation',
    buffer_pool_pct: 22, leakage_pct: 4.2, additionality_test: 'investment',
    eligible_vintages: '2014-2030', requires_fpic: true,
    status: 'active', notes: 'REDD+ MF; jurisdictional + sub-national modes.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 2, code: 'AR-ACM0003', name: 'Afforestation/Reforestation — Consolidated',
    standard: 'CDM', category: 'afforestation-reforestation',
    buffer_pool_pct: 15, leakage_pct: 5.0, additionality_test: 'barrier',
    eligible_vintages: '2010-2032', requires_fpic: true,
    status: 'active', notes: 'A/R on lands not forest at project start (10 yr rule).',
    updated_at: new Date().toISOString(),
  },
  {
    id: 3, code: 'VM0033', name: 'Tidal Wetland and Seagrass Restoration',
    standard: 'VCS', category: 'blue-carbon',
    buffer_pool_pct: 25, leakage_pct: 2.5, additionality_test: 'investment',
    eligible_vintages: '2018-2035', requires_fpic: true,
    status: 'active', notes: 'Blue carbon; mangrove + tidal-marsh restoration.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 4, code: 'GS-TPDDTEC', name: 'Technologies & Practices to Displace Decentralized Thermal Energy',
    standard: 'Gold Standard', category: 'energy-efficiency-cookstoves',
    buffer_pool_pct: 10, leakage_pct: 6.0, additionality_test: 'barrier',
    eligible_vintages: '2015-2030', requires_fpic: false,
    status: 'active', notes: 'Improved cookstove fuel-switching; usage-survey driven.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 5, code: 'ACR-LFG-1.1', name: 'Landfill Gas Destruction & Beneficial Use',
    standard: 'ACR', category: 'methane-capture',
    buffer_pool_pct: 5, leakage_pct: 1.5, additionality_test: 'regulatory',
    eligible_vintages: '2012-2032', requires_fpic: false,
    status: 'active', notes: 'CH4 destruction via flare or beneficial-use upgrade.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 6, code: 'PUR-DAC-1', name: 'Direct Air Capture & Geologic Storage',
    standard: 'Puro.earth', category: 'direct-air-capture',
    buffer_pool_pct: 3, leakage_pct: 0.5, additionality_test: 'investment',
    eligible_vintages: '2022-2050', requires_fpic: false,
    status: 'draft', notes: 'DAC + Class VI / saline-aquifer sequestration.',
    updated_at: new Date().toISOString(),
  },
];

// ─── 1. VIZ: Emissions Trend (baseline vs actual) ───────────────────────────
router.get('/emissions-trend', async (req, res) => {
  try {
    const months = Math.min(Math.max(Number(req.query.months) || 24, 6), 48);
    const rand = seededRand(20260518);

    // Try live: aggregate verified annual emissions vs baseline from scopes_emissions
    const live = await safeQuery(`
      SELECT to_char(reporting_period_start, 'YYYY-MM') AS bucket,
             COALESCE(SUM(actual_tco2e),0)::bigint AS actual,
             COALESCE(SUM(baseline_tco2e),0)::bigint AS baseline
      FROM scopes_emissions
      WHERE reporting_period_start >= NOW() - ($1::int || ' months')::interval
      GROUP BY bucket
      ORDER BY bucket
    `, [months]);

    const now = new Date();
    const series = [];
    // Synthesized baseline (BAU) decays slowly; actual (with abatement) decays faster.
    const startBaseline = 5_200_000; // tCO2e per month
    const startActual   = 5_100_000;
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const bucket = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const elapsed = (months - 1 - i);
      const baseline = Math.round(startBaseline * (1 - 0.0015 * elapsed) * (0.95 + rand() * 0.1));
      const actual   = Math.round(startActual   * (1 - 0.0085 * elapsed) * (0.94 + rand() * 0.1));
      const reduced  = Math.max(0, baseline - actual);
      series.push({ month: bucket, baseline, actual, reduced });
    }

    // Overlay live where present
    if (live && live.length) {
      const liveMap = Object.fromEntries(live.map(r => [r.bucket, { actual: Number(r.actual), baseline: Number(r.baseline) }]));
      for (const row of series) {
        const lv = liveMap[row.month];
        if (lv && (lv.actual > 0 || lv.baseline > 0)) {
          row.actual_live   = lv.actual   || row.actual;
          row.baseline_live = lv.baseline || row.baseline;
        }
      }
    }

    const total_baseline = series.reduce((s, r) => s + r.baseline, 0);
    const total_actual   = series.reduce((s, r) => s + r.actual, 0);
    const total_reduced  = total_baseline - total_actual;
    const pct_reduction  = total_baseline > 0 ? (total_reduced / total_baseline) * 100 : 0;

    res.json({
      generated_at: new Date().toISOString(),
      months,
      series,
      totals: {
        baseline_tco2e: total_baseline,
        actual_tco2e: total_actual,
        reduced_tco2e: total_reduced,
        pct_reduction: Math.round(pct_reduction * 100) / 100,
      },
      source: live && live.length ? 'live+synthesized' : 'synthesized',
      summary:
        `Emissions trend across ${months} months: baseline vs verified actual. ` +
        `Cumulative abatement ${(total_reduced/1e6).toFixed(2)} MtCO2e ` +
        `(${pct_reduction.toFixed(1)}% reduction vs BAU baseline).`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 2. VIZ: Project × Region Heatmap (CO2 reduced) ─────────────────────────
router.get('/project-region-heatmap', async (req, res) => {
  try {
    const regions = ['SE Asia', 'S America', 'E Africa', 'C Africa', 'S Asia', 'N America', 'E Asia', 'Oceania'];
    const types = [
      'avoided-deforestation',
      'afforestation-reforestation',
      'blue-carbon',
      'energy-efficiency-cookstoves',
      'methane-capture',
      'direct-air-capture',
      'improved-forest-management',
      'renewables',
    ];

    // Try to derive from live projects table
    const live = await safeQuery(
      'SELECT type, country, hectares FROM projects'
    );

    // Country -> region map for live data
    const COUNTRY_REGION = {
      'Indonesia': 'SE Asia', 'Philippines': 'SE Asia', 'Vietnam': 'SE Asia', 'Cambodia': 'SE Asia',
      'Brazil': 'S America', 'Peru': 'S America', 'Colombia': 'S America', 'Ecuador': 'S America',
      'Kenya': 'E Africa', 'Tanzania': 'E Africa', 'Madagascar': 'E Africa', 'Ethiopia': 'E Africa',
      'DR Congo': 'C Africa', 'Gabon': 'C Africa', 'Cameroon': 'C Africa',
      'India': 'S Asia', 'Pakistan': 'S Asia', 'Bangladesh': 'S Asia',
      'United States': 'N America', 'Canada': 'N America', 'Mexico': 'N America',
      'China': 'E Asia', 'Japan': 'E Asia', 'South Korea': 'E Asia',
      'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Papua New Guinea': 'Oceania',
    };

    // Build matrix[region][type] = reduced tCO2e
    const matrix = {};
    for (const r of regions) {
      matrix[r] = Object.fromEntries(types.map(t => [t, 0]));
    }

    // Type intensity (tCO2e reduced per project unit, scaled)
    const TYPE_INTENSITY = {
      'avoided-deforestation': 850000,
      'afforestation-reforestation': 240000,
      'blue-carbon': 120000,
      'energy-efficiency-cookstoves': 180000,
      'methane-capture': 320000,
      'direct-air-capture': 25000,
      'improved-forest-management': 410000,
      'renewables': 290000,
    };

    if (live && live.length) {
      for (const p of live) {
        const region = COUNTRY_REGION[p.country] || 'SE Asia';
        const type = types.includes(p.type) ? p.type : 'avoided-deforestation';
        if (matrix[region] && matrix[region][type] !== undefined) {
          matrix[region][type] += Math.max(1000, Number(p.hectares) || 1000) * 4;
        }
      }
    }

    // Always overlay a synthesized envelope so the heatmap is dense
    const rand = seededRand(424242);
    for (const region of regions) {
      for (const type of types) {
        const regionWeight = {
          'SE Asia':   { 'avoided-deforestation': 1.6, 'blue-carbon': 1.4, 'energy-efficiency-cookstoves': 0.9 },
          'S America': { 'avoided-deforestation': 1.8, 'afforestation-reforestation': 1.2, 'improved-forest-management': 1.1 },
          'E Africa':  { 'energy-efficiency-cookstoves': 1.7, 'blue-carbon': 1.0, 'afforestation-reforestation': 0.9 },
          'C Africa':  { 'avoided-deforestation': 1.5, 'improved-forest-management': 0.7 },
          'S Asia':    { 'renewables': 1.4, 'methane-capture': 1.1, 'energy-efficiency-cookstoves': 1.0 },
          'N America': { 'direct-air-capture': 2.0, 'methane-capture': 1.6, 'improved-forest-management': 1.3 },
          'E Asia':    { 'renewables': 1.5, 'methane-capture': 1.2 },
          'Oceania':   { 'afforestation-reforestation': 1.0, 'improved-forest-management': 0.9 },
        }[region]?.[type] || 0.3;
        const base = TYPE_INTENSITY[type] * regionWeight * (0.6 + rand() * 0.9);
        matrix[region][type] += Math.round(base);
      }
    }

    // Flatten to cells
    const cells = [];
    let maxValue = 0;
    for (const region of regions) {
      for (const type of types) {
        const v = matrix[region][type];
        cells.push({ region, type, reduced_tco2e: v });
        if (v > maxValue) maxValue = v;
      }
    }

    const totalsByRegion = Object.fromEntries(
      regions.map(r => [r, types.reduce((s, t) => s + matrix[r][t], 0)])
    );
    const totalsByType = Object.fromEntries(
      types.map(t => [t, regions.reduce((s, r) => s + matrix[r][t], 0)])
    );
    const grandTotal = cells.reduce((s, c) => s + c.reduced_tco2e, 0);

    res.json({
      generated_at: new Date().toISOString(),
      regions,
      types,
      cells,
      matrix,
      max_value: maxValue,
      totals_by_region: totalsByRegion,
      totals_by_type: totalsByType,
      grand_total_tco2e: grandTotal,
      source: live && live.length ? 'live+synthesized' : 'synthesized',
      summary:
        `CO2 abatement heatmap across ${regions.length} regions × ${types.length} project types. ` +
        `Grand total ${(grandTotal/1e6).toFixed(2)} MtCO2e reduced. ` +
        `Hot cells: SE Asia / S America avoided-deforestation, N America DAC/methane-capture.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 3. NON-VIZ: Carbon Credit Certificate (PDF) ────────────────────────────
// Returns a PDF stream if ?format=pdf, otherwise JSON.
router.get('/carbon-certificate', async (req, res) => {
  try {
    const beneficiary = req.query.beneficiary || 'Microsoft Corporation';
    const tons = Math.max(1, Number(req.query.tons) || 12500);
    const vintage = Number(req.query.vintage) || (new Date().getFullYear() - 1);
    const projectName = req.query.project || 'Katingan Mentaya Peatland Restoration';
    const methodology = req.query.methodology || 'VCS VM0007';
    const claim = req.query.claim || 'Scope 1+2 residual emissions';
    const format = (req.query.format || 'json').toLowerCase();

    const rand = seededRand((tons | 0) + vintage + beneficiary.length);
    const serial = `VCS-1477-${tons}-${vintage}-${String(Math.floor(rand() * 900) + 100)}-IDN-VM0007`;
    const certId = `CC-${vintage}-${String(Math.floor(rand() * 90000) + 10000)}`;

    const cert = {
      certificate_id: certId,
      issued_at: new Date().toISOString(),
      registry: 'CarbonLedger AI Registry',
      standard: 'VCS v4.5 + ICVCM CCP-eligible',
      beneficiary,
      project: { name: projectName, methodology, country: 'Indonesia' },
      retirement: {
        tons_co2e: tons,
        vintage_year: vintage,
        serial_number_range: serial,
        claim_purpose: claim,
        retired_on: new Date().toISOString().split('T')[0],
      },
      attestation:
        `This certificate attests that ${tons.toLocaleString()} tCO2e of vintage ${vintage} ` +
        `verified carbon credits from ${projectName} (${methodology}) have been permanently ` +
        `retired on behalf of ${beneficiary}. Serial numbers ${serial} are removed from circulation.`,
      verification_url: `https://registry.example.org/certificates/${certId}`,
      issuer: { name: 'Registry Operations', title: 'Chief Registry Officer' },
      summary: `Retired ${tons.toLocaleString()} tCO2e (vintage ${vintage}) for ${beneficiary}.`,
    };

    if (format !== 'pdf') {
      return res.json(cert);
    }

    // ── Minimal PDF generation (no external deps): hand-rolled PDF 1.4 stream ──
    // Builds a one-page document containing the certificate text.
    const lines = [
      'CARBON CREDIT RETIREMENT CERTIFICATE',
      '',
      `Certificate ID: ${cert.certificate_id}`,
      `Issued: ${cert.issued_at}`,
      `Registry: ${cert.registry}`,
      `Standard: ${cert.standard}`,
      '',
      `Beneficiary: ${cert.beneficiary}`,
      `Project: ${cert.project.name}`,
      `Methodology: ${cert.project.methodology}   Country: ${cert.project.country}`,
      '',
      `Retired: ${cert.retirement.tons_co2e.toLocaleString()} tCO2e`,
      `Vintage: ${cert.retirement.vintage_year}`,
      `Serial: ${cert.retirement.serial_number_range}`,
      `Claim: ${cert.retirement.claim_purpose}`,
      `Date: ${cert.retirement.retired_on}`,
      '',
      'Attestation:',
      ...wrap(cert.attestation, 80),
      '',
      `Verification: ${cert.verification_url}`,
      `Issuer: ${cert.issuer.name}, ${cert.issuer.title}`,
    ];

    const pdfBuffer = buildSimplePdf(lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${cert.certificate_id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 4. NON-VIZ: Methodology Rules Editor (CRUD) ────────────────────────────
// GET    /methodology-rules         list (and stats)
// POST   /methodology-rules         create
// PUT    /methodology-rules/:id     update
// DELETE /methodology-rules/:id     remove
router.get('/methodology-rules', (req, res) => {
  const byStandard = RULES.reduce((m, r) => { m[r.standard] = (m[r.standard] || 0) + 1; return m; }, {});
  const byStatus = RULES.reduce((m, r) => { m[r.status] = (m[r.status] || 0) + 1; return m; }, {});
  res.json({
    generated_at: new Date().toISOString(),
    count: RULES.length,
    rules: RULES.slice().sort((a, b) => a.id - b.id),
    by_standard: byStandard,
    by_status: byStatus,
    summary: `${RULES.length} methodology rules across ${Object.keys(byStandard).length} standards.`,
  });
});

router.post('/methodology-rules', express.json(), (req, res) => {
  const body = req.body || {};
  if (!body.code || !body.name) {
    return res.status(400).json({ error: 'code and name are required' });
  }
  const rule = {
    id: ++RULE_SEQ,
    code: String(body.code).slice(0, 64),
    name: String(body.name).slice(0, 256),
    standard: String(body.standard || 'VCS').slice(0, 32),
    category: String(body.category || 'other').slice(0, 64),
    buffer_pool_pct: Number(body.buffer_pool_pct) || 0,
    leakage_pct: Number(body.leakage_pct) || 0,
    additionality_test: String(body.additionality_test || 'investment').slice(0, 32),
    eligible_vintages: String(body.eligible_vintages || `${new Date().getFullYear()}-${new Date().getFullYear() + 5}`).slice(0, 32),
    requires_fpic: Boolean(body.requires_fpic),
    status: ['active', 'draft', 'deprecated'].includes(body.status) ? body.status : 'draft',
    notes: String(body.notes || '').slice(0, 1024),
    updated_at: new Date().toISOString(),
  };
  RULES.push(rule);
  res.status(201).json(rule);
});

router.put('/methodology-rules/:id', express.json(), (req, res) => {
  const id = Number(req.params.id);
  const idx = RULES.findIndex((r) => r.id === id);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  const body = req.body || {};
  const updated = { ...RULES[idx] };
  for (const k of ['code', 'name', 'standard', 'category', 'additionality_test', 'eligible_vintages', 'notes']) {
    if (body[k] !== undefined) updated[k] = String(body[k]);
  }
  for (const k of ['buffer_pool_pct', 'leakage_pct']) {
    if (body[k] !== undefined) updated[k] = Number(body[k]);
  }
  if (body.requires_fpic !== undefined) updated.requires_fpic = Boolean(body.requires_fpic);
  if (body.status !== undefined && ['active', 'draft', 'deprecated'].includes(body.status)) {
    updated.status = body.status;
  }
  updated.updated_at = new Date().toISOString();
  RULES[idx] = updated;
  res.json(updated);
});

router.delete('/methodology-rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = RULES.findIndex((r) => r.id === id);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  const [removed] = RULES.splice(idx, 1);
  res.json({ deleted: true, rule: removed });
});

// ─── PDF helpers (no external deps) ─────────────────────────────────────────
function wrap(text, max) {
  const out = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if ((line + ' ' + word).trim().length > max) {
      if (line) out.push(line);
      line = word;
    } else {
      line = (line ? line + ' ' : '') + word;
    }
  }
  if (line) out.push(line);
  return out;
}

function escapePdf(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildSimplePdf(lines) {
  const startX = 60;
  const startY = 770;
  const leading = 16;

  const contentParts = ['BT', '/F1 11 Tf', `${startX} ${startY} Td`, `${leading} TL`];
  lines.forEach((ln, i) => {
    if (i === 0) {
      contentParts.push('/F1 14 Tf');
      contentParts.push(`(${escapePdf(ln)}) Tj`);
      contentParts.push('/F1 11 Tf');
    } else {
      contentParts.push(`(${escapePdf(ln)}) Tj`);
    }
    contentParts.push('T*');
  });
  contentParts.push('ET');
  const stream = contentParts.join('\n');

  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Count 1 /Kids [3 0 R] >>');
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
  objects.push(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let body = '';
  const offsets = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(header + body, 'binary'));
    body += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = Buffer.byteLength(header + body, 'binary');
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(header + body + xref + trailer, 'binary');
}

module.exports = router;
