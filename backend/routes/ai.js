const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { OPENROUTER_MODEL } = require('../config/openrouter');
const { notify } = require('../services/notifications');
const {
  verifyProject,
  synthesizeMRV,
  detectFraud,
  analyzePricing,
  mapMethodology,
  draftDisclosure,
  leakageModeler,
  satelliteMRV,
  doubleCountingDetect,
  additionalityScorer,
  registryArbitrage,
  priceDiscovery,
  biodiversityCoBenefit,
  climateClaimValidator,
  supplyCapForecast,
  scope3Attributor,
  mrvDocumentValidate,
  narrativeEvidenceReconcile,
  amlScreenTransaction,
  projectRating,
} = require('../services/ai');

async function persistResult(feature, input, output) {
  try {
    await pool.query(
      'INSERT INTO ai_results (feature, input, output, model) VALUES ($1,$2,$3,$4)',
      [feature, input ? JSON.stringify(input) : null, output ? JSON.stringify(output) : null, OPENROUTER_MODEL]
    );
  } catch (e) {
    console.warn('[ai_results] persist failed:', e.message);
  }
}

function wrap(feature, fn, requiredKeys) {
  return async (req, res) => {
    try {
      for (const k of requiredKeys) {
        if (req.body[k] === undefined || req.body[k] === null || req.body[k] === '') {
          return res.status(400).json({ error: `${k} is required` });
        }
      }
      const args = requiredKeys.map((k) => req.body[k]);
      const result = await fn(...args);
      await persistResult(feature, req.body, result);
      // Side-effect: fraud detection generates a notification when score is high.
      if (feature === 'detect-fraud' && result && (result.fraud_risk_score || 0) >= 70) {
        notify('fraud-alert', `High fraud risk (${result.fraud_risk_score})`, result.summary || '').catch(() => {});
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

// Existing 6
router.post('/verify-project',  wrap('verify-project',  verifyProject,    ['project']));
router.post('/synthesize-mrv',  wrap('synthesize-mrv',  synthesizeMRV,    ['project']));
router.post('/detect-fraud',    wrap('detect-fraud',    detectFraud,      ['transaction']));
router.post('/analyze-pricing', wrap('analyze-pricing', analyzePricing,   ['project_type', 'vintage']));
router.post('/map-methodology', wrap('map-methodology', mapMethodology,   ['project']));
router.post('/draft-disclosure',wrap('draft-disclosure',draftDisclosure,  ['holder']));

// New 10
router.post('/leakage-modeler',          wrap('leakage-modeler',          leakageModeler,         ['project']));
router.post('/satellite-mrv',            wrap('satellite-mrv',            satelliteMRV,           ['project', 'imagery_period']));
router.post('/double-counting-detect',   wrap('double-counting-detect',   doubleCountingDetect,   ['credit']));
router.post('/additionality-scorer',     wrap('additionality-scorer',     additionalityScorer,    ['project']));
router.post('/registry-arbitrage',       wrap('registry-arbitrage',       registryArbitrage,      ['project_type']));
router.post('/price-discovery',          wrap('price-discovery',          priceDiscovery,         ['project_type', 'vintage']));
router.post('/biodiversity-co-benefit',  wrap('biodiversity-co-benefit',  biodiversityCoBenefit,  ['project']));
router.post('/climate-claim-validator',  wrap('climate-claim-validator',  climateClaimValidator,  ['claim']));
router.post('/supply-cap-forecast',      wrap('supply-cap-forecast',      supplyCapForecast,      ['project_type']));
router.post('/scope-3-attributor',       wrap('scope-3-attributor',       scope3Attributor,       ['holder']));

// Pass 7: backlog implementation — 4 new AI verbs
router.post('/mrv-document-validate',      wrap('mrv-document-validate',      mrvDocumentValidate,         ['mrv_document', 'methodology']));
router.post('/narrative-evidence-reconcile', wrap('narrative-evidence-reconcile', narrativeEvidenceReconcile, ['narrative', 'evidence']));
router.post('/aml-screen-transaction',     wrap('aml-screen-transaction',     amlScreenTransaction,        ['transaction']));
router.post('/project-rating',             wrap('project-rating',             projectRating,               ['project']));

// Pass 7: NEEDS-CREDS — registry interop stubs (Verra / Gold Standard / ACR / CAR)
function registryInteropStub(registry) {
  return (req, res) => res.status(503).json({
    error: 'registry_interop_not_configured',
    registry,
    message: `${registry} registry interop adapter is not configured. Requires registry API credentials.`,
    required_credentials: [`${registry.toUpperCase()}_API_KEY`, `${registry.toUpperCase()}_API_SECRET`],
  });
}
router.post('/registry-interop/verra/sync',         registryInteropStub('verra'));
router.post('/registry-interop/gold-standard/sync', registryInteropStub('gold-standard'));
router.post('/registry-interop/acr/sync',           registryInteropStub('acr'));
router.post('/registry-interop/car/sync',           registryInteropStub('car'));
router.get('/registry-interop/status', (req, res) => {
  res.json({
    adapters: [
      { registry: 'verra', configured: false, status: 'needs-credentials' },
      { registry: 'gold-standard', configured: false, status: 'needs-credentials' },
      { registry: 'acr', configured: false, status: 'needs-credentials' },
      { registry: 'car', configured: false, status: 'needs-credentials' },
    ],
  });
});

// Sample scenarios — hardcoded inline, 5 per AI feature.
// Each sample is { label, values: { fieldName: value, ... } } that the frontend
// can splat directly into its form state. Field keys match the AI page field keys.
const SAMPLES = {
  'verify-project': [
    {
      label: 'Indonesian REDD+ (Katingan Peatland)',
      values: {
        name: 'Katingan Mentaya Peatland Restoration',
        type: 'avoided-deforestation',
        country: 'Indonesia',
        hectares: 149800,
        description: 'Peat-swamp forest conservation in Central Kalimantan under VCS VM0007 (REDD+ Methodology Framework) with 60-year crediting. Protects deep peat (>3m) against palm-oil concession encroachment; community livelihoods program with 34 villages.',
      },
    },
    {
      label: 'Kenyan Cookstove (Hifadhi Energy-Efficient)',
      values: {
        name: 'Hifadhi Energy-Efficient Cookstoves',
        type: 'energy-efficiency-cookstoves',
        country: 'Kenya',
        hectares: 0,
        description: 'Distribution of 100,000 efficient biomass cookstoves across Embu and Meru counties under Gold Standard TPDDTEC v3.1. Reduces non-renewable biomass use by ~60%; suppressed-demand baseline applied.',
      },
    },
    {
      label: 'Brazilian ARR (Atlantic Forest)',
      values: {
        name: 'Mata Atlântica Reforestation Initiative',
        type: 'afforestation-reforestation',
        country: 'Brazil',
        hectares: 8400,
        description: 'Native species ARR on degraded cattle pasture in Bahia under VCS VM0047 (Afforestation, Reforestation and Revegetation). 35-yr crediting; 130+ native species; 20% buffer; CCB Gold validated for biodiversity.',
      },
    },
    {
      label: 'Peruvian Blue-Carbon Mangrove',
      values: {
        name: 'Tumbes Mangrove Blue-Carbon Restoration',
        type: 'blue-carbon',
        country: 'Peru',
        hectares: 2750,
        description: 'Mangrove restoration along Tumbes estuary under VCS VM0033 (Tidal Wetland and Seagrass Restoration). Avicennia germinans and Rhizophora mangle replanting; community-managed; baseline shrimp-pond conversion.',
      },
    },
    {
      label: 'US Voluntary Methane (Dairy Digester)',
      values: {
        name: 'Tulare Dairy Methane Digester Cluster',
        type: 'methane-capture',
        country: 'United States',
        hectares: 0,
        description: 'Anaerobic digester capture at 12 California dairies under ACR Livestock Waste Management Methodology v3.0. Biogas-to-RNG injected to CNG pipeline; LCFS-stackable; ~145,000 tCO2e/yr.',
      },
    },
  ],
  'synthesize-mrv': [
    {
      label: 'Kasigau Corridor REDD+ (Kenya, VM0009)',
      values: {
        name: 'Kasigau Corridor REDD+ Phase II',
        type: 'avoided-deforestation',
        country: 'Kenya',
        methodology: 'VM0009',
        hectares: 200000,
        baseline_period: '2005-2010',
        notes: 'Dryland Acacia-Commiphora forest between Tsavo East and West NPs. Wildlife Works developer. Community land trust governance; remote-sensing-based MRV with LiDAR plots.',
      },
    },
    {
      label: 'Rimba Raya REDD+ (Indonesia, VM0007)',
      values: {
        name: 'Rimba Raya Biodiversity Reserve',
        type: 'avoided-deforestation',
        country: 'Indonesia',
        methodology: 'VM0007',
        hectares: 64977,
        baseline_period: '2008-2013',
        notes: 'Tropical peat-swamp REDD+ in Central Kalimantan adjacent to Tanjung Puting NP. Orangutan habitat; CCB Triple Gold. Annual peat-depth monitoring; community patrols.',
      },
    },
    {
      label: 'Mikoko Pamoja Blue-Carbon (Kenya, VM0033)',
      values: {
        name: 'Mikoko Pamoja Mangrove',
        type: 'blue-carbon',
        country: 'Kenya',
        methodology: 'VM0033',
        hectares: 117,
        baseline_period: '2010-2013',
        notes: 'World-first Plan Vivo blue-carbon project at Gazi Bay. Annual 3,000 tCO2e from mangrove restoration + protection. Plot-based biomass plus sediment-core stock measurement.',
      },
    },
    {
      label: 'Sumatra Mangrove (Indonesia, VM0007)',
      values: {
        name: 'Sumatra Mangrove Blue Carbon',
        type: 'blue-carbon',
        country: 'Indonesia',
        methodology: 'VM0007',
        hectares: 5400,
        baseline_period: '2018-2023',
        notes: 'Mangrove restoration along Riau coast under VCS VM0007 REDD+ MF v1.6 with VM0033 module. Sediment depth 1.8m; baseline aquaculture expansion.',
      },
    },
    {
      label: 'Acre State Jurisdictional REDD+ (Brazil)',
      values: {
        name: 'Acre Jurisdictional REDD+ Program',
        type: 'jurisdictional-redd',
        country: 'Brazil',
        methodology: 'ART TREES 2.0',
        hectares: 16400000,
        baseline_period: '2015-2020',
        notes: 'Jurisdictional REDD+ at sub-national scale; ART TREES registration. Cross-cutting MRV via PRODES + DETER alerts; benefit-sharing with Indigenous lands.',
      },
    },
  ],
  'detect-fraud': [
    {
      label: 'Wash-trade ring (low-price churn)',
      values: {
        transaction_id: 'TX-2025-04412',
        from_holder: 'EcoTrade Capital LLC',
        to_holder: 'Greenwave Holdings Pte',
        credits_amount: 50000,
        price_per_ton_usd: 1.25,
        notes: 'Counterparty flagged on KYC; ten round-trip trades in 48 hours at off-market price. Serial number gap detected across three vintages.',
      },
    },
    {
      label: 'Shell-buyer retirement spike',
      values: {
        transaction_id: 'TX-2025-07781',
        from_holder: 'Sumatra Forestry Carbon Ltd',
        to_holder: 'Atlas Sustainability SPV-7',
        credits_amount: 220000,
        price_per_ton_usd: 4.10,
        notes: 'SPV registered 3 weeks ago in Cayman; no public ESG mandate. Intends full retirement same day. Beneficial-ownership opaque.',
      },
    },
    {
      label: 'Cross-registry double-issuance suspect',
      values: {
        transaction_id: 'TX-2025-09023',
        from_holder: 'Kalimantan Conservation Trust',
        to_holder: 'NetZero Buyers Cooperative',
        credits_amount: 18500,
        price_per_ton_usd: 8.75,
        notes: 'Project also appears in Plan Vivo registry for overlapping vintage 2022. Geometry match 94% with Verra VCS-2031.',
      },
    },
    {
      label: 'Over-the-market premium (potential collusion)',
      values: {
        transaction_id: 'TX-2025-10145',
        from_holder: 'Pacific Mangrove Holdings',
        to_holder: 'Climate Forward Brokerage',
        credits_amount: 9000,
        price_per_ton_usd: 78.00,
        notes: 'Blue-carbon mangrove vintage 2023 normally trades $18-26/t. Price 3x market with no corresponding buyer announcement. Both parties share board director.',
      },
    },
    {
      label: 'KYC-flagged sanctioned counterparty',
      values: {
        transaction_id: 'TX-2025-11789',
        from_holder: 'Andes Reforestation S.A.C.',
        to_holder: 'Eurasian Carbon Exchange',
        credits_amount: 35000,
        price_per_ton_usd: 5.50,
        notes: 'Buyer entity matches OFAC SDN beneficial-owner list (75% confidence). Wire transfer routed via three jurisdictions in 24h.',
      },
    },
  ],
  'analyze-pricing': [
    { label: 'REDD+ avoided-deforestation, 2023', values: { project_type: 'avoided-deforestation', vintage: 2023 } },
    { label: 'ARR afforestation, 2022', values: { project_type: 'afforestation-reforestation', vintage: 2022 } },
    { label: 'Blue-carbon mangrove, 2023', values: { project_type: 'blue-carbon', vintage: 2023 } },
    { label: 'Cookstoves, 2024', values: { project_type: 'energy-efficiency-cookstoves', vintage: 2024 } },
    { label: 'Engineered DAC removal, 2024', values: { project_type: 'direct-air-capture', vintage: 2024 } },
  ],
  'map-methodology': [
    {
      label: 'Sumatra Mangrove (Blue-Carbon)',
      values: {
        name: 'Sumatra Mangrove Blue Carbon',
        type: 'blue-carbon',
        country: 'Indonesia',
        hectares: 5400,
        description: 'Mangrove restoration along Riau coastline. Sediment-rich Avicennia/Rhizophora system; aquaculture-conversion baseline; community fishery co-management.',
      },
    },
    {
      label: 'Brazil Atlantic-Forest ARR',
      values: {
        name: 'Bahia Atlantic Forest Restoration',
        type: 'afforestation-reforestation',
        country: 'Brazil',
        hectares: 12500,
        description: 'Native-species restoration of degraded pasture in southern Bahia. 130 native species mix; CCB Gold candidate; 35-yr crediting target.',
      },
    },
    {
      label: 'Peruvian Amazon REDD+ (Madre de Dios)',
      values: {
        name: 'Madre de Dios Amazon Conservation',
        type: 'avoided-deforestation',
        country: 'Peru',
        hectares: 89000,
        description: 'Protection of primary lowland Amazon forest against illegal gold-mining frontier; Indigenous co-management with Harakbut and Yine communities.',
      },
    },
    {
      label: 'Kenyan Improved Cookstoves',
      values: {
        name: 'Embu Hifadhi Cookstove Programme',
        type: 'energy-efficiency-cookstoves',
        country: 'Kenya',
        hectares: 0,
        description: '100k high-efficiency biomass stoves in central Kenya. Replaces 3-stone fires; suppressed-demand baseline; non-renewable-biomass fraction 0.92.',
      },
    },
    {
      label: 'US Dairy Methane Digester',
      values: {
        name: 'Tulare Dairy Digester Cluster',
        type: 'methane-capture',
        country: 'United States',
        hectares: 0,
        description: 'Methane capture at 12 dairy lagoons in California. RNG injection into PG&E pipeline; CDM AMS-III.D inspired baseline; LCFS-eligible.',
      },
    },
  ],
  'draft-disclosure': [
    {
      label: 'Microsoft — corporate net-negative target',
      values: {
        name: 'Microsoft Corporation',
        type: 'corporate',
        country: 'United States',
        credits_used_tco2e: 1500000,
        targets: 'Carbon-negative by 2030; remove all historical emissions since 1975 by 2050. $1B Climate Innovation Fund. SBTi 1.5C-aligned scope 1+2+3.',
      },
    },
    {
      label: 'Stripe — frontier removal portfolio',
      values: {
        name: 'Stripe, Inc.',
        type: 'corporate',
        country: 'United States',
        credits_used_tco2e: 92000,
        targets: 'Pre-purchase frontier carbon removal via Frontier Fund ($1B by 2030). Net-zero scope 1+2 by 2030; durable removal-only purchases.',
      },
    },
    {
      label: 'Shell plc — energy transition',
      values: {
        name: 'Shell plc',
        type: 'corporate',
        country: 'Netherlands',
        credits_used_tco2e: 4500000,
        targets: 'Net-zero scope 1+2+3 by 2050. Interim 50% scope 1+2 reduction by 2030 vs 2016. Nature-based and engineered removals up to ~120 MtCO2e/yr by 2030.',
      },
    },
    {
      label: 'Unilever — value-chain net-zero',
      values: {
        name: 'Unilever plc',
        type: 'corporate',
        country: 'United Kingdom',
        credits_used_tco2e: 380000,
        targets: 'Net-zero across value chain by 2039. Operations net-zero by 2030. Climate & Nature Fund €1B. SBTi 1.5C scope 1+2+3 validated.',
      },
    },
    {
      label: 'Singapore Sovereign Climate Office',
      values: {
        name: 'Singapore Climate Office',
        type: 'government',
        country: 'Singapore',
        credits_used_tco2e: 2200000,
        targets: 'Net-zero by 2050 under Singapore Green Plan 2030. Carbon tax S$25/tCO2e in 2024 rising to S$45 by 2026; Article 6.2 procurement program.',
      },
    },
  ],
  'leakage-modeler': [
    {
      label: 'Kasigau Corridor REDD+ (Kenya)',
      values: {
        name: 'Kasigau Corridor REDD+',
        type: 'avoided-deforestation',
        country: 'Kenya',
        hectares: 200000,
        description: 'Dryland forest protection against charcoal & subsistence agriculture pressure. Leakage belt of 3 community ranches; reference region across 6 sub-counties.',
      },
    },
    {
      label: 'Katingan Peatland (Indonesia)',
      values: {
        name: 'Katingan Mentaya Peatland',
        type: 'avoided-deforestation',
        country: 'Indonesia',
        hectares: 149800,
        description: 'Peat-swamp REDD+ surrounded by palm-oil concessions. Activity-shifting leakage risk to adjacent concession blocks; market leakage via palm-oil substitution.',
      },
    },
    {
      label: 'Madre de Dios Amazon (Peru)',
      values: {
        name: 'Madre de Dios Amazon Conservation',
        type: 'avoided-deforestation',
        country: 'Peru',
        hectares: 89000,
        description: 'Primary Amazon protection against illegal alluvial gold-mining frontier. Leakage to adjacent Tambopata reserve buffer; cross-border to Bolivia possible.',
      },
    },
    {
      label: 'Acre Jurisdictional REDD+ (Brazil)',
      values: {
        name: 'Acre Jurisdictional REDD+',
        type: 'jurisdictional-redd',
        country: 'Brazil',
        hectares: 16400000,
        description: 'Sub-national jurisdictional program. Activity-shifting leakage absorbed within jurisdiction; cross-state to Amazonas/Rondônia is residual concern.',
      },
    },
    {
      label: 'Bahia Atlantic Forest ARR',
      values: {
        name: 'Mata Atlântica ARR',
        type: 'afforestation-reforestation',
        country: 'Brazil',
        hectares: 8400,
        description: 'ARR on former cattle pasture. Displacement of grazing leakage modeled per VM0047 tool; market leakage minimal due to extensive cattle system.',
      },
    },
  ],
  'satellite-mrv': [
    { label: 'Katingan Peat — 2023-Q1..2024-Q1', values: { name: 'Katingan Mentaya Peatland', type: 'avoided-deforestation', country: 'Indonesia', imagery_period: '2023-Q1..2024-Q1' } },
    { label: 'Kasigau Corridor — 2023..2024', values: { name: 'Kasigau Corridor REDD+', type: 'avoided-deforestation', country: 'Kenya', imagery_period: '2023-01..2024-01' } },
    { label: 'Mata Atlântica ARR — 2022..2024', values: { name: 'Mata Atlântica Restoration', type: 'afforestation-reforestation', country: 'Brazil', imagery_period: '2022-Q4..2024-Q4' } },
    { label: 'Tumbes Mangroves — 2023..2024', values: { name: 'Tumbes Mangrove Blue Carbon', type: 'blue-carbon', country: 'Peru', imagery_period: '2023-Q1..2024-Q1' } },
    { label: 'Madre de Dios — 2024H1', values: { name: 'Madre de Dios Amazon Conservation', type: 'avoided-deforestation', country: 'Peru', imagery_period: '2024-01..2024-06' } },
  ],
  'double-counting-detect': [
    {
      label: 'Kasigau REDD+ vintage 2021 (VM0009)',
      values: {
        credit_id: 'CR-2021-KEN-027',
        project: 'Kasigau Corridor REDD+',
        vintage_year: 2021,
        tons_co2e: 12500,
        methodology: 'VM0009',
        serial_number: 'VCS-1387-12500-2021-001-KEN-VM0009',
      },
    },
    {
      label: 'Katingan peat vintage 2022 (VM0007)',
      values: {
        credit_id: 'CR-2022-IDN-0044',
        project: 'Katingan Mentaya Peatland',
        vintage_year: 2022,
        tons_co2e: 25000,
        methodology: 'VM0007',
        serial_number: 'VCS-1477-25000-2022-002-IDN-VM0007',
      },
    },
    {
      label: 'Rimba Raya vintage 2020 (VM0007)',
      values: {
        credit_id: 'CR-2020-IDN-0118',
        project: 'Rimba Raya Biodiversity Reserve',
        vintage_year: 2020,
        tons_co2e: 80000,
        methodology: 'VM0007',
        serial_number: 'VCS-674-80000-2020-005-IDN-VM0007',
      },
    },
    {
      label: 'Acre Jurisdictional vintage 2021 (ART TREES)',
      values: {
        credit_id: 'CR-2021-BRA-J001',
        project: 'Acre Jurisdictional REDD+',
        vintage_year: 2021,
        tons_co2e: 500000,
        methodology: 'ART TREES 2.0',
        serial_number: 'ART-TREES-500000-2021-001-BRA',
      },
    },
    {
      label: 'Mikoko Pamoja blue-carbon vintage 2022',
      values: {
        credit_id: 'CR-2022-KEN-MP034',
        project: 'Mikoko Pamoja Mangrove',
        vintage_year: 2022,
        tons_co2e: 3000,
        methodology: 'VM0033',
        serial_number: 'PV-MP-3000-2022-034-KEN-VM0033',
      },
    },
  ],
  'additionality-scorer': [
    {
      label: 'Gujarat Wind Power (India)',
      values: {
        name: 'Gujarat Wind Power Project',
        type: 'renewables',
        country: 'India',
        description: '198 MW onshore wind farm in Kutch district. Investment-test additionality contested in low-FIT environment; barriers analysis cites grid-evacuation curtailment.',
      },
    },
    {
      label: 'Katingan Peatland REDD+ (Indonesia)',
      values: {
        name: 'Katingan Mentaya Peatland',
        type: 'avoided-deforestation',
        country: 'Indonesia',
        description: 'Peat-swamp conservation under VCS VM0007; counterfactual = palm-oil concession conversion. Carbon-finance dependency >85% of opex.',
      },
    },
    {
      label: 'Hifadhi Cookstoves (Kenya)',
      values: {
        name: 'Hifadhi Cookstoves',
        type: 'energy-efficiency-cookstoves',
        country: 'Kenya',
        description: 'High-efficiency biomass cookstoves under GS TPDDTEC. Performance-method additionality; suppressed-demand baseline; carbon finance covers subsidy.',
      },
    },
    {
      label: 'California Forest IFM (USA)',
      values: {
        name: 'Mendocino Improved Forest Management',
        type: 'improved-forest-management',
        country: 'United States',
        description: 'IFM on private redwood/Douglas-fir tract under CARB Compliance Offset Protocol. Regulatory-surplus test scrutinized; common-practice analysis required.',
      },
    },
    {
      label: 'Tumbes Mangrove ARR (Peru)',
      values: {
        name: 'Tumbes Mangrove Restoration',
        type: 'blue-carbon',
        country: 'Peru',
        description: 'Mangrove restoration on abandoned shrimp ponds under VM0033. No regulatory mandate; community lacks restoration capital; financial barrier clear.',
      },
    },
  ],
  'registry-arbitrage': [
    { label: 'Avoided deforestation (REDD+)', values: { project_type: 'avoided-deforestation' } },
    { label: 'Afforestation / reforestation (ARR)', values: { project_type: 'afforestation-reforestation' } },
    { label: 'Improved forest management (IFM)', values: { project_type: 'improved-forest-management' } },
    { label: 'Blue-carbon mangrove', values: { project_type: 'blue-carbon' } },
    { label: 'Efficient cookstoves', values: { project_type: 'energy-efficiency-cookstoves' } },
  ],
  'price-discovery': [
    { label: 'REDD+ avoided deforestation, 2023', values: { project_type: 'avoided-deforestation', vintage: 2023 } },
    { label: 'Blue-carbon mangrove, 2023', values: { project_type: 'blue-carbon', vintage: 2023 } },
    { label: 'ARR native-species, 2022', values: { project_type: 'afforestation-reforestation', vintage: 2022 } },
    { label: 'Improved forest management, 2021', values: { project_type: 'improved-forest-management', vintage: 2021 } },
    { label: 'Direct air capture (DAC), 2024', values: { project_type: 'direct-air-capture', vintage: 2024 } },
  ],
  'biodiversity-co-benefit': [
    {
      label: 'Rimba Raya (Indonesia, orangutan)',
      values: {
        name: 'Rimba Raya Biodiversity Reserve',
        type: 'avoided-deforestation',
        country: 'Indonesia',
        description: 'Tropical peat-swamp adjacent to Tanjung Puting NP. Habitat for ~120 IUCN red-list species incl. Bornean orangutan (CR), proboscis monkey (EN), Storm\'s stork.',
      },
    },
    {
      label: 'Kasigau Corridor (Kenya, elephant)',
      values: {
        name: 'Kasigau Corridor REDD+',
        type: 'avoided-deforestation',
        country: 'Kenya',
        description: 'Wildlife corridor between Tsavo East and West NPs. African elephant (EN), Grevy\'s zebra (EN), African wild dog (EN), hirola antelope (CR) range overlap.',
      },
    },
    {
      label: 'Madre de Dios (Peru, Amazon)',
      values: {
        name: 'Madre de Dios Amazon Conservation',
        type: 'avoided-deforestation',
        country: 'Peru',
        description: 'Lowland Amazon adjacent to Tambopata-Bahuaja. Jaguar, giant otter (EN), harpy eagle, 600+ bird species. Indigenous Harakbut and Yine territories.',
      },
    },
    {
      label: 'Mata Atlântica ARR (Brazil)',
      values: {
        name: 'Bahia Atlantic Forest Restoration',
        type: 'afforestation-reforestation',
        country: 'Brazil',
        description: 'Atlantic Forest hotspot restoration; golden-headed lion tamarin (EN), maned sloth (VU), 8% endemism in flora. Targets CCB Gold biodiversity.',
      },
    },
    {
      label: 'Tumbes Mangrove (Peru blue-carbon)',
      values: {
        name: 'Tumbes Mangrove Restoration',
        type: 'blue-carbon',
        country: 'Peru',
        description: 'Tumbes mangrove ecoregion; American crocodile, Pacific seahorse, mangrove black-hawk, juvenile nursery for 60+ fish species incl. white shrimp.',
      },
    },
  ],
  'climate-claim-validator': [
    {
      label: 'Microsoft — carbon-negative by 2030',
      values: {
        holder: 'Microsoft Corporation',
        type: 'net-negative',
        scope: '1+2+3',
        year: 2030,
        evidence: 'Carbon-negative by 2030; remove all historical CO2 since founding (1975) by 2050. SBTi 1.5C-aligned reductions; $1B Climate Innovation Fund; durable removal portfolio via Frontier.',
      },
    },
    {
      label: 'Shell — net-zero 2050 claim',
      values: {
        holder: 'Shell plc',
        type: 'net-zero',
        scope: '1+2+3',
        year: 2050,
        evidence: 'Operating + product net-zero by 2050. 50% absolute scope 1+2 reduction by 2030 vs 2016. Heavy reliance on nature-based offsets up to 120 MtCO2e/yr — Dutch court ruling 2021 challenged trajectory.',
      },
    },
    {
      label: 'Delta Air Lines — carbon-neutral (FTC challenge)',
      values: {
        holder: 'Delta Air Lines',
        type: 'carbon-neutral',
        scope: '1+2',
        year: 2020,
        evidence: 'Self-declared carbon-neutral from March 2020 via $30M offset purchases. Subject to FTC Green-Guides class action over offset quality (REDD+ over-crediting allegations).',
      },
    },
    {
      label: 'Apple — supply-chain carbon-neutral 2030',
      values: {
        holder: 'Apple Inc.',
        type: 'carbon-neutral',
        scope: '1+2+3',
        year: 2030,
        evidence: 'Supply-chain + products carbon-neutral by 2030; 75% reduction first, residual via high-quality nature-based removals (Restore Fund). Verra-registered ARR projects in Latin America.',
      },
    },
    {
      label: 'Nestlé — net-zero 2050 (SBTi-validated)',
      values: {
        holder: 'Nestlé S.A.',
        type: 'net-zero',
        scope: '1+2+3',
        year: 2050,
        evidence: 'SBTi 1.5C net-zero by 2050; interim 50% absolute by 2030. CHF 1.2B regenerative-agriculture program. Has retracted some "carbon-neutral" product claims after greenwash criticism.',
      },
    },
  ],
  'supply-cap-forecast': [
    { label: 'Avoided deforestation (REDD+)', values: { project_type: 'avoided-deforestation' } },
    { label: 'Afforestation / reforestation (ARR)', values: { project_type: 'afforestation-reforestation' } },
    { label: 'Blue-carbon mangrove', values: { project_type: 'blue-carbon' } },
    { label: 'Cookstoves / household devices', values: { project_type: 'energy-efficiency-cookstoves' } },
    { label: 'Direct air capture (DAC)', values: { project_type: 'direct-air-capture' } },
  ],
  'scope-3-attributor': [
    {
      label: 'Microsoft (tech, $245B)',
      values: { name: 'Microsoft Corporation', type: 'corporate', country: 'United States', sector: 'technology', revenue_musd: 245000 },
    },
    {
      label: 'Shell (energy, $381B)',
      values: { name: 'Shell plc', type: 'corporate', country: 'Netherlands', sector: 'energy', revenue_musd: 381000 },
    },
    {
      label: 'Unilever (CPG, $63B)',
      values: { name: 'Unilever plc', type: 'corporate', country: 'United Kingdom', sector: 'consumer-goods', revenue_musd: 63000 },
    },
    {
      label: 'Maersk (shipping, $51B)',
      values: { name: 'A.P. Moller-Maersk', type: 'corporate', country: 'Denmark', sector: 'shipping-logistics', revenue_musd: 51000 },
    },
    {
      label: 'JBS S.A. (agri/meat, $73B)',
      values: { name: 'JBS S.A.', type: 'corporate', country: 'Brazil', sector: 'agriculture-meat', revenue_musd: 73000 },
    },
  ],
  'mrv-document-validate': [
    {
      label: 'Kasigau Corridor REDD+ MRV (VM0009)',
      values: {
        project_name: 'Kasigau Corridor REDD+ Phase II',
        methodology: 'VM0009',
        monitoring_period: '2022-01-01..2022-12-31',
        baseline_emissions_tco2e: 850000,
        project_emissions_tco2e: 120000,
        leakage_tco2e: 8500,
        ndvi_delta: -0.04,
        sampling_design: 'Permanent sample plots (PSPs) + LiDAR; 95% CI; n=380 plots',
        notes: 'Dryland REDD+ MRV report v2.3 submitted by Wildlife Works. Independent VVB review pending.',
      },
    },
    {
      label: 'Katingan Peatland MRV (VM0007)',
      values: {
        project_name: 'Katingan Mentaya Peatland',
        methodology: 'VM0007',
        monitoring_period: '2023-Q1..2023-Q4',
        baseline_emissions_tco2e: 7500000,
        project_emissions_tco2e: 1200000,
        leakage_tco2e: 95000,
        ndvi_delta: -0.02,
        sampling_design: 'Peat depth coring + remote sensing (Sentinel-2); biomass plots n=520',
        notes: 'VM0007 REDD+ MF v1.6 with peatland module. Annual subsequent monitoring report.',
      },
    },
    {
      label: 'Mikoko Pamoja Blue-Carbon MRV (VM0033)',
      values: {
        project_name: 'Mikoko Pamoja Mangrove',
        methodology: 'VM0033',
        monitoring_period: '2022-01-01..2022-12-31',
        baseline_emissions_tco2e: 4200,
        project_emissions_tco2e: 1100,
        leakage_tco2e: 80,
        ndvi_delta: 0.08,
        sampling_design: 'Mangrove biomass plots + sediment core dating; n=24 plots',
        notes: 'Annual Plan Vivo MRV. Tide-gauge calibration; community-collected ground truth.',
      },
    },
    {
      label: 'Mata Atlântica ARR MRV (VM0047)',
      values: {
        project_name: 'Bahia Atlantic Forest Restoration',
        methodology: 'VM0047',
        monitoring_period: '2023-01-01..2023-12-31',
        baseline_emissions_tco2e: 18000,
        project_emissions_tco2e: 1800,
        leakage_tco2e: 350,
        ndvi_delta: 0.18,
        sampling_design: 'Stratified random plots; DBH + allometric models; n=130 plots',
        notes: 'First-period MRV report for VM0047 ARR. Targets CCB Gold biodiversity validation.',
      },
    },
    {
      label: 'Tulare Dairy Digester MRV (ACR Livestock v3.0)',
      values: {
        project_name: 'Tulare Dairy Methane Digester Cluster',
        methodology: 'ACR Livestock Waste Management v3.0',
        monitoring_period: '2023-01-01..2023-12-31',
        baseline_emissions_tco2e: 165000,
        project_emissions_tco2e: 12000,
        leakage_tco2e: 0,
        ndvi_delta: 0,
        sampling_design: 'Continuous gas-flow meters; quarterly calibration; SCADA logs',
        notes: 'Methane destruction via digester + RNG injection. LCFS-stackable; OPR cross-check.',
      },
    },
  ],
  'narrative-evidence-reconcile': [
    {
      label: 'Rimba Raya — narrative claims vs satellite',
      values: {
        narrative: JSON.stringify({
          project: 'Rimba Raya Biodiversity Reserve',
          claim: 'Protected 64,977 ha of peat-swamp forest; zero deforestation 2020-2023; community patrols expanded to 12 villages.',
        }, null, 2),
        evidence: JSON.stringify({
          satellite_alerts_2020_2023: 18,
          canopy_loss_ha: 142,
          patrol_logs_villages_covered: 7,
          attachments: ['quarterly_patrol_report_2022.pdf', 'sentinel2_delta_2020_2023.tif'],
          finance_ledger_disbursements_usd: 4200000,
        }, null, 2),
      },
    },
    {
      label: 'Kasigau Corridor — narrative vs ground-truth',
      values: {
        narrative: JSON.stringify({
          project: 'Kasigau Corridor REDD+',
          claim: 'Protected 200,000 ha against charcoal pressure; 0.3% annual deforestation rate vs 1.8% reference region; 65% benefit-share to communities.',
        }, null, 2),
        evidence: JSON.stringify({
          satellite_deforestation_rate_pct: 0.42,
          reference_region_rate_pct: 1.6,
          benefit_share_pct_actual: 60,
          attachments: ['community_benefit_report_2023.pdf'],
          finance_ledger_community_disbursements_usd: 1850000,
        }, null, 2),
      },
    },
    {
      label: 'Tumbes Mangrove — restoration claim vs imagery',
      values: {
        narrative: JSON.stringify({
          project: 'Tumbes Mangrove Restoration',
          claim: '2,750 ha restored; 1.2M seedlings planted; 78% survival rate at year 3.',
        }, null, 2),
        evidence: JSON.stringify({
          satellite_mangrove_extent_delta_ha: 2120,
          ndvi_avg_year3: 0.62,
          attachments: ['planting_log_2022.csv', 'survival_audit_2024.pdf'],
          ground_truth_plots_survival_pct: 71,
        }, null, 2),
      },
    },
    {
      label: 'Hifadhi Cookstoves — adoption claim vs sales',
      values: {
        narrative: JSON.stringify({
          project: 'Hifadhi Energy-Efficient Cookstoves',
          claim: '100,000 stoves distributed across Embu/Meru; 92% sustained use at month 18.',
        }, null, 2),
        evidence: JSON.stringify({
          sales_records_units: 87500,
          usage_monitor_devices_n: 1200,
          monitored_sustained_use_pct: 78,
          attachments: ['sales_ledger_2023.csv', 'kitchen_survey_2024.pdf'],
        }, null, 2),
      },
    },
    {
      label: 'Acre Jurisdictional — emissions vs PRODES',
      values: {
        narrative: JSON.stringify({
          project: 'Acre Jurisdictional REDD+',
          claim: '52% reduction in deforestation vs FREL baseline 2015-2020; 16.4M ha covered.',
        }, null, 2),
        evidence: JSON.stringify({
          prodes_observed_deforestation_ha: 18200,
          frel_baseline_ha: 31000,
          deter_alerts_2023: 1450,
          attachments: ['art_trees_submission_2023.pdf', 'prodes_2023_acre.geojson'],
        }, null, 2),
      },
    },
  ],
  'aml-screen-transaction': [
    {
      label: 'OFAC-flagged buyer (Eurasian Carbon Exchange)',
      values: {
        transaction_id: 'TX-2025-11789',
        from_holder: 'Andes Reforestation S.A.C.',
        to_holder: 'Eurasian Carbon Exchange',
        from_country: 'Peru',
        to_country: 'Russia',
        credits_amount: 35000,
        price_per_ton_usd: 5.50,
        payment_route_jurisdictions: 'Latvia, UAE, Cyprus',
        notes: 'Buyer entity matches OFAC SDN beneficial-owner list (75% confidence). Wire transfer routed via three jurisdictions in 24h.',
      },
    },
    {
      label: 'Wash-trading ring (round-trips)',
      values: {
        transaction_id: 'TX-2025-04412',
        from_holder: 'EcoTrade Capital LLC',
        to_holder: 'Greenwave Holdings Pte',
        from_country: 'Cayman Islands',
        to_country: 'Singapore',
        credits_amount: 50000,
        price_per_ton_usd: 1.25,
        payment_route_jurisdictions: 'BVI',
        notes: 'Ten round-trip trades in 48 hours at off-market price. Typology: layering + wash-trading.',
      },
    },
    {
      label: 'Shell-buyer instant-retirement',
      values: {
        transaction_id: 'TX-2025-07781',
        from_holder: 'Sumatra Forestry Carbon Ltd',
        to_holder: 'Atlas Sustainability SPV-7',
        from_country: 'Indonesia',
        to_country: 'Cayman Islands',
        credits_amount: 220000,
        price_per_ton_usd: 4.10,
        payment_route_jurisdictions: 'Cayman Islands',
        notes: 'SPV registered 3 weeks ago; no ESG mandate; intends full retirement same day. Beneficial ownership opaque.',
      },
    },
    {
      label: 'PEP-linked counterparty',
      values: {
        transaction_id: 'TX-2025-13442',
        from_holder: 'Orinoco Forest Holdings',
        to_holder: 'Caribbean Climate Fund SA',
        from_country: 'Venezuela',
        to_country: 'Panama',
        credits_amount: 15000,
        price_per_ton_usd: 7.20,
        payment_route_jurisdictions: 'Panama, Switzerland',
        notes: 'UBO is immediate family member of Venezuelan minister (PEP screening). Source-of-funds documentation incomplete.',
      },
    },
    {
      label: 'Clean transaction (low risk)',
      values: {
        transaction_id: 'TX-2025-15500',
        from_holder: 'Verra Registered Holder #12381',
        to_holder: 'Microsoft Corporation',
        from_country: 'Brazil',
        to_country: 'United States',
        credits_amount: 8500,
        price_per_ton_usd: 18.50,
        payment_route_jurisdictions: 'United States',
        notes: 'Both parties KYC-verified; standard ARR project credits; market price; documented retirement intent.',
      },
    },
  ],
  'project-rating': [
    {
      label: 'Katingan Peatland (Indonesia, REDD+)',
      values: {
        name: 'Katingan Mentaya Peatland',
        type: 'avoided-deforestation',
        country: 'Indonesia',
        hectares: 149800,
        methodology: 'VM0007',
        vintage_range: '2010-2024',
        description: 'Peat-swamp REDD+ with strong additionality (palm-oil counterfactual), VVB-verified MRV, CCB Triple Gold, but elevated reversal risk from peat fires.',
      },
    },
    {
      label: 'Kasigau Corridor REDD+ (Kenya)',
      values: {
        name: 'Kasigau Corridor REDD+',
        type: 'avoided-deforestation',
        country: 'Kenya',
        hectares: 200000,
        methodology: 'VM0009',
        vintage_range: '2011-2024',
        description: 'Dryland REDD+ with community land trust governance, biodiversity corridor between Tsavo NPs. Past over-crediting concerns flagged; remediated baseline.',
      },
    },
    {
      label: 'Mata Atlântica ARR (Brazil)',
      values: {
        name: 'Bahia Atlantic Forest Restoration',
        type: 'afforestation-reforestation',
        country: 'Brazil',
        hectares: 8400,
        methodology: 'VM0047',
        vintage_range: '2020-2024',
        description: 'Native-species ARR on degraded pasture; 130+ species; 20% buffer pool; CCB Gold for biodiversity; clear financial additionality.',
      },
    },
    {
      label: 'Tulare Dairy Methane (USA)',
      values: {
        name: 'Tulare Dairy Methane Digester Cluster',
        type: 'methane-capture',
        country: 'United States',
        hectares: 0,
        methodology: 'ACR Livestock Waste Management v3.0',
        vintage_range: '2019-2024',
        description: 'Anaerobic digester at 12 dairies; continuous gas-flow monitoring; LCFS-stackable. Regulatory-surplus contested in CA dairy methane policy environment.',
      },
    },
    {
      label: 'Mikoko Pamoja Blue-Carbon (Kenya)',
      values: {
        name: 'Mikoko Pamoja Mangrove',
        type: 'blue-carbon',
        country: 'Kenya',
        hectares: 117,
        methodology: 'VM0033',
        vintage_range: '2014-2024',
        description: 'Community-managed mangrove blue-carbon; Plan Vivo; strong social co-benefits; small scale but high-integrity MRV; durable permanence.',
      },
    },
  ],
};

// GET /api/ai/samples?feature=<verb>
// Returns 5 hardcoded realistic carbon-market sample scenarios for the given verb.
router.get('/samples', (req, res) => {
  const feature = String(req.query.feature || '').trim();
  if (!feature) return res.status(400).json({ error: 'feature query param is required' });
  const samples = SAMPLES[feature];
  if (!samples) return res.status(404).json({ error: `no samples for feature '${feature}'`, available: Object.keys(SAMPLES) });
  res.json({ feature, samples });
});

// History
router.get('/results', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ai_results ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const { feature } = req.query;
    const limit = Math.min(Number(req.query.limit) || 25, 100);
    let result;
    if (feature) {
      result = await pool.query(
        'SELECT id, feature, input, output, model, created_at FROM ai_results WHERE feature = $1 ORDER BY created_at DESC LIMIT $2',
        [feature, limit]
      );
    } else {
      result = await pool.query(
        'SELECT id, feature, input, output, model, created_at FROM ai_results ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
