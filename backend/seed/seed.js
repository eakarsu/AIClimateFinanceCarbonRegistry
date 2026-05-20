const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'carbon_registry',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('[seed] dropping & recreating tables...');
    await client.query(`
      DROP TABLE IF EXISTS webhook_deliveries CASCADE;
      DROP TABLE IF EXISTS webhooks CASCADE;
      DROP TABLE IF EXISTS attachments CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS finance_ledger CASCADE;
      DROP TABLE IF EXISTS biodiversity_cobenefits CASCADE;
      DROP TABLE IF EXISTS claims CASCADE;
      DROP TABLE IF EXISTS smr_reports CASCADE;
      DROP TABLE IF EXISTS satellite_imagery CASCADE;
      DROP TABLE IF EXISTS jurisdictional_baselines CASCADE;
      DROP TABLE IF EXISTS scoreboard CASCADE;
      DROP TABLE IF EXISTS scopes_emissions CASCADE;
      DROP TABLE IF EXISTS beneficiaries CASCADE;
      DROP TABLE IF EXISTS retirements CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS issuances CASCADE;
      DROP TABLE IF EXISTS methodologies CASCADE;
      DROP TABLE IF EXISTS audits CASCADE;
      DROP TABLE IF EXISTS transactions CASCADE;
      DROP TABLE IF EXISTS verifiers CASCADE;
      DROP TABLE IF EXISTS holders CASCADE;
      DROP TABLE IF EXISTS credits CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS ai_results CASCADE;
    `);

    const schema1 = fs.readFileSync(path.join(__dirname, '../migrations/001_schema.sql'), 'utf8');
    await client.query(schema1);
    const schema2 = fs.readFileSync(path.join(__dirname, '../migrations/002_extensions.sql'), 'utf8');
    await client.query(schema2);

    // ---------- USERS (RBAC) ----------
    const users = [
      ['registry@carbon.io', 'Registry Admin', 'admin'],
      ['registrar@carbon.io', 'Olivia Registrar', 'registrar'],
      ['auditor@carbon.io', 'Marcus Auditor', 'auditor'],
    ];
    for (const [email, name, role] of users) {
      const hash = bcrypt.hashSync('carbon2026', 10);
      await client.query(
        `INSERT INTO users (email, name, password_hash, role) VALUES ($1,$2,$3,$4)
         ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, password_hash=EXCLUDED.password_hash, role=EXCLUDED.role`,
        [email, name, hash, role]
      );
    }

    // ---------- PROJECTS ----------
    const projects = [
      ['CP-IDN-0001', 'Katingan Mentaya Peatland Restoration', 'avoided-deforestation', 'Indonesia', 149800, 'active', 'Peat-swamp forest conservation in Central Kalimantan', 'PT Rimba Makmur Utama'],
      ['CP-BRA-0014', 'Jari Pará REDD+ Project', 'avoided-deforestation', 'Brazil', 414900, 'active', 'Amazon rainforest preservation in northern Brazil', 'Biofílica Ambipar'],
      ['CP-KEN-0027', 'Kasigau Corridor REDD+', 'avoided-deforestation', 'Kenya', 200000, 'active', 'Dryland forest protection between Tsavo parks', 'Wildlife Works'],
      ['CP-PER-0033', 'Cordillera Azul National Park REDD+', 'avoided-deforestation', 'Peru', 1351964, 'active', 'Andean Amazon transition forest conservation', 'CIMA Cordillera Azul'],
      ['CP-IDN-0041', 'Rimba Raya Biodiversity Reserve', 'avoided-deforestation', 'Indonesia', 64000, 'verified', 'Orangutan habitat preservation', 'InfiniteEARTH'],
      ['CP-BRA-0058', 'Mata Atlântica Reforestation', 'reforestation', 'Brazil', 12500, 'active', 'Native species replanting in Atlantic Forest', 'SOS Mata Atlântica'],
      ['CP-KEN-0062', 'Kenya Improved Cookstoves', 'cookstoves', 'Kenya', 0, 'active', 'Distribution of fuel-efficient cookstoves', 'BURN Manufacturing'],
      ['CP-IDN-0077', 'Sumatra Mangrove Blue Carbon', 'blue-carbon', 'Indonesia', 8400, 'active', 'Mangrove restoration along Riau coastline', 'YAGASU'],
      ['CP-PER-0083', 'Madre de Dios Amazon REDD', 'avoided-deforestation', 'Peru', 100000, 'verified', 'Brazil-nut concession conservation', 'Bosques Amazónicos'],
      ['CP-USA-0091', 'California Methane Capture - Dairy', 'methane-capture', 'United States', 0, 'active', 'Anaerobic digesters at dairy operations', 'Maas Energy Works'],
      ['CP-IND-0104', 'Gujarat Wind Power Project', 'renewables', 'India', 0, 'active', '50 MW wind farm in Kutch district', 'Suzlon Energy'],
      ['CP-CHN-0116', 'Inner Mongolia Solar Array', 'renewables', 'China', 0, 'pending', '120 MW PV solar in Wulanchabu', 'China Three Gorges'],
      ['CP-BRA-0128', 'Pará Mangrove Conservation', 'blue-carbon', 'Brazil', 18200, 'verified', 'Coastal mangrove protection in Amazon delta', 'Conservation International'],
      ['CP-KEN-0139', 'Aberdare Reforestation Initiative', 'reforestation', 'Kenya', 7800, 'active', 'Watershed restoration in Aberdare Range', 'Green Belt Movement'],
      ['CP-IDN-0145', 'Sulawesi Cookstove Program', 'cookstoves', 'Indonesia', 0, 'retired', 'Improved biomass cookstoves rural Sulawesi', 'KOPERNIK'],
    ];
    for (const p of projects) {
      await client.query(
        `INSERT INTO projects (project_id, name, type, country, hectares, status, description, developer, registered_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW() - ($9::int || ' days')::interval)`,
        [...p, Math.floor(Math.random() * 1500) + 90]
      );
    }

    // ---------- CREDITS ----------
    const credits = [
      ['CR-2019-IDN-001', 'Katingan Mentaya Peatland Restoration', 2019, 1850000, 'issued', 'VM0007'],
      ['CR-2020-BRA-014', 'Jari Pará REDD+ Project', 2020, 920000, 'transferred', 'VM0015'],
      ['CR-2021-KEN-027', 'Kasigau Corridor REDD+', 2021, 1200000, 'retired', 'VM0009'],
      ['CR-2022-PER-033', 'Cordillera Azul National Park REDD+', 2022, 3100000, 'issued', 'VM0015'],
      ['CR-2018-IDN-041', 'Rimba Raya Biodiversity Reserve', 2018, 760000, 'retired', 'VM0007'],
      ['CR-2023-BRA-058', 'Mata Atlântica Reforestation', 2023, 42000, 'issued', 'AR-ACM0003'],
      ['CR-2022-KEN-062', 'Kenya Improved Cookstoves', 2022, 185000, 'transferred', 'GS-TPDDTEC'],
      ['CR-2023-IDN-077', 'Sumatra Mangrove Blue Carbon', 2023, 28000, 'issued', 'VM0033'],
      ['CR-2021-PER-083', 'Madre de Dios Amazon REDD', 2021, 540000, 'retired', 'VM0015'],
      ['CR-2024-USA-091', 'California Methane Capture - Dairy', 2024, 75000, 'issued', 'ACM0010'],
      ['CR-2022-IND-104', 'Gujarat Wind Power Project', 2022, 105000, 'transferred', 'ACM0002'],
      ['CR-2020-BRA-128', 'Pará Mangrove Conservation', 2020, 31000, 'retired', 'VM0033'],
      ['CR-2023-KEN-139', 'Aberdare Reforestation Initiative', 2023, 18500, 'issued', 'AR-ACM0003'],
      ['CR-2019-IDN-145', 'Sulawesi Cookstove Program', 2019, 92000, 'retired', 'GS-TPDDTEC'],
      ['CR-2024-IDN-001', 'Katingan Mentaya Peatland Restoration', 2024, 1450000, 'issued', 'VM0007'],
    ];
    for (const c of credits) {
      await client.query(
        `INSERT INTO credits (credit_id, project, vintage_year, tons_co2e, status, methodology, serial_number, issued_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, NOW() - ($8::int || ' days')::interval)`,
        [...c, `${c[0]}-SN-${Math.floor(Math.random() * 90000) + 10000}`, Math.floor(Math.random() * 900) + 30]
      );
    }

    // ---------- HOLDERS ----------
    const holders = [
      ['HD-0001', 'Microsoft Corporation', 'corporate', 'United States', 'verified', 'sustainability@microsoft.com'],
      ['HD-0002', 'Alphabet Inc.', 'corporate', 'United States', 'verified', 'climate@google.com'],
      ['HD-0003', 'Shell plc', 'corporate', 'United Kingdom', 'verified', 'carbon@shell.com'],
      ['HD-0004', 'Salesforce Inc.', 'corporate', 'United States', 'verified', 'netzero@salesforce.com'],
      ['HD-0005', 'BP plc', 'corporate', 'United Kingdom', 'verified', 'offsets@bp.com'],
      ['HD-0006', 'South Pole Group', 'broker', 'Switzerland', 'verified', 'trading@southpole.com'],
      ['HD-0007', 'Climate Impact Partners', 'broker', 'United Kingdom', 'verified', 'desk@climateimpact.com'],
      ['HD-0008', 'NatureVest Carbon Fund', 'fund', 'United States', 'verified', 'fund@naturevest.org'],
      ['HD-0009', 'Vertree Partners', 'broker', 'United Kingdom', 'verified', 'ops@vertree.com'],
      ['HD-0010', 'Carbon Streaming Corp', 'fund', 'Canada', 'verified', 'ir@carbonstreaming.com'],
      ['HD-0011', 'Allianz Climate Solutions', 'fund', 'Germany', 'verified', 'climate@allianz.com'],
      ['HD-0012', 'Jane Doe', 'individual', 'Australia', 'verified', 'jane.doe@example.com'],
      ['HD-0013', 'Hartono Wibowo', 'individual', 'Indonesia', 'pending', 'h.wibowo@example.id'],
      ['HD-0014', 'Stripe Climate', 'corporate', 'United States', 'verified', 'climate@stripe.com'],
      ['HD-0015', 'EcoTrade Capital', 'broker', 'Singapore', 'rejected', 'compliance@ecotrade.sg'],
    ];
    for (const h of holders) {
      await client.query(
        `INSERT INTO holders (holder_id, name, type, country, kyc_status, email, registered_at)
         VALUES ($1,$2,$3,$4,$5,$6, NOW() - ($7::int || ' days')::interval)`,
        [...h, Math.floor(Math.random() * 1200) + 60]
      );
    }

    // ---------- VERIFIERS ----------
    const verifiers = [
      ['VV-0001', 'SCS Global Services', 'Verra VVB, Gold Standard VVB', 412, 14, 'active', 'United States'],
      ['VV-0002', 'AENOR Internacional', 'Verra VVB, ACR Validator', 287, 28, 'active', 'Spain'],
      ['VV-0003', 'TÜV NORD CERT GmbH', 'CDM DOE, Verra VVB', 638, 9, 'active', 'Germany'],
      ['VV-0004', 'Bureau Veritas', 'Verra VVB, GS VVB, CAR Verifier', 745, 21, 'active', 'France'],
      ['VV-0005', 'Earthood Services', 'Verra VVB, Gold Standard', 199, 45, 'active', 'India'],
      ['VV-0006', 'EPIC Sustainability', 'Verra VVB', 88, 62, 'active', 'United Kingdom'],
      ['VV-0007', 'RINA Services S.p.A.', 'CDM DOE, Verra VVB', 326, 18, 'active', 'Italy'],
      ['VV-0008', 'Carbon Check (India)', 'Verra VVB, Gold Standard', 244, 30, 'active', 'India'],
      ['VV-0009', 'KBS Cert.', 'Verra Validator', 67, 90, 'suspended', 'South Korea'],
      ['VV-0010', 'LGAI Technological Center', 'Verra VVB', 154, 33, 'active', 'Spain'],
      ['VV-0011', 'Ruby Canyon Environmental', 'CAR Verifier, ACR Validator', 178, 11, 'active', 'United States'],
      ['VV-0012', 'First Environment', 'Verra VVB, CAR Verifier', 211, 26, 'active', 'United States'],
      ['VV-0013', 'Aenor Mexico', 'Verra VVB', 92, 50, 'active', 'Mexico'],
      ['VV-0014', 'Det Norske Veritas (DNV)', 'CDM DOE, Verra VVB', 880, 7, 'active', 'Norway'],
      ['VV-0015', 'EcoCert Brasil', 'Verra Validator', 41, 110, 'suspended', 'Brazil'],
    ];
    for (const v of verifiers) {
      await client.query(
        `INSERT INTO verifiers (verifier_id, name, accreditation, verification_count, last_audit_at, status, country)
         VALUES ($1,$2,$3,$4, NOW() - ($5::int || ' days')::interval, $6, $7)`,
        v
      );
    }

    // ---------- TRANSACTIONS ----------
    const transactions = [
      ['TX-0001', 'Microsoft Corporation', 'South Pole Group', 250000, 14.50, 'settled', 'Bulk REDD+ retirement Q1'],
      ['TX-0002', 'South Pole Group', 'Alphabet Inc.', 180000, 18.75, 'settled', 'Nature-based portfolio'],
      ['TX-0003', 'Shell plc', 'Climate Impact Partners', 500000, 8.20, 'settled', 'Bulk avoided-def credits'],
      ['TX-0004', 'NatureVest Carbon Fund', 'Salesforce Inc.', 95000, 22.10, 'settled', 'Premium nature-based'],
      ['TX-0005', 'BP plc', 'Vertree Partners', 320000, 9.80, 'pending', 'Q4 acquisition'],
      ['TX-0006', 'Carbon Streaming Corp', 'Microsoft Corporation', 145000, 25.60, 'settled', 'Blue carbon premium'],
      ['TX-0007', 'Allianz Climate Solutions', 'Stripe Climate', 12000, 95.40, 'settled', 'Engineered removals'],
      ['TX-0008', 'EcoTrade Capital', 'Jane Doe', 50, 14.20, 'failed', 'KYC failure on seller'],
      ['TX-0009', 'Climate Impact Partners', 'Hartono Wibowo', 200, 11.50, 'pending', 'Retail offsetting'],
      ['TX-0010', 'South Pole Group', 'Shell plc', 410000, 7.90, 'settled', 'Wholesale bulk'],
      ['TX-0011', 'Vertree Partners', 'NatureVest Carbon Fund', 80000, 16.30, 'settled', 'Fund rebalance'],
      ['TX-0012', 'Microsoft Corporation', 'Carbon Streaming Corp', 60000, 19.40, 'settled', 'Strategic retirement'],
      ['TX-0013', 'Stripe Climate', 'Allianz Climate Solutions', 8500, 88.20, 'settled', 'DAC pilot tranche'],
      ['TX-0014', 'Climate Impact Partners', 'BP plc', 275000, 8.45, 'settled', 'Compliance buffer'],
      ['TX-0015', 'EcoTrade Capital', 'Vertree Partners', 18000, 13.75, 'failed', 'Double-issuance flagged'],
    ];
    for (const t of transactions) {
      await client.query(
        `INSERT INTO transactions (transaction_id, from_holder, to_holder, credits_amount, price_per_ton_usd, status, notes, occurred_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, NOW() - ($8::int || ' days')::interval)`,
        [...t, Math.floor(Math.random() * 360) + 5]
      );
    }

    // ---------- AUDITS ----------
    const audits = [
      ['AU-0001', 'Katingan Mentaya Peatland Restoration', 'SCS Global Services', 'compliant', 'https://registry.verra.org/audit/katingan-2023.pdf', 'Verification confirmed satellite-monitored deforestation rates'],
      ['AU-0002', 'Jari Pará REDD+ Project', 'AENOR Internacional', 'non-conformance', 'https://registry.verra.org/audit/jari-2023.pdf', 'Minor non-conformance on community benefit-sharing records'],
      ['AU-0003', 'Kasigau Corridor REDD+', 'Bureau Veritas', 'compliant', 'https://registry.verra.org/audit/kasigau-2024.pdf', 'Full compliance with VM0009 monitoring plan'],
      ['AU-0004', 'Cordillera Azul National Park REDD+', 'TÜV NORD CERT GmbH', 'compliant', 'https://registry.verra.org/audit/cordillera-2024.pdf', 'Strong baseline; LiDAR-validated AGB'],
      ['AU-0005', 'Rimba Raya Biodiversity Reserve', 'Earthood Services', 'major-finding', 'https://registry.verra.org/audit/rimba-2023.pdf', 'Major: leakage belt monitoring incomplete'],
      ['AU-0006', 'Mata Atlântica Reforestation', 'AENOR Internacional', 'compliant', 'https://registry.verra.org/audit/mata-2024.pdf', 'Sapling survival 87%; on-track'],
      ['AU-0007', 'Kenya Improved Cookstoves', 'Carbon Check (India)', 'non-conformance', 'https://goldstandard.org/audit/kenya-stoves-2023.pdf', 'Usage survey sampling below threshold'],
      ['AU-0008', 'Sumatra Mangrove Blue Carbon', 'EPIC Sustainability', 'compliant', 'https://registry.verra.org/audit/sumatra-mangrove-2024.pdf', 'Mangrove BGB rigorously sampled'],
      ['AU-0009', 'Madre de Dios Amazon REDD', 'Bureau Veritas', 'compliant', 'https://registry.verra.org/audit/mdd-2023.pdf', 'Concession-level monitoring solid'],
      ['AU-0010', 'California Methane Capture - Dairy', 'Ruby Canyon Environmental', 'compliant', 'https://americancarbonregistry.org/audit/ca-dairy-2024.pdf', 'Flow-meter calibration current'],
      ['AU-0011', 'Gujarat Wind Power Project', 'Earthood Services', 'compliant', 'https://cdm.unfccc.int/audit/gujarat-wind-2023.pdf', 'Grid-emission factor validated'],
      ['AU-0012', 'Inner Mongolia Solar Array', 'TÜV NORD CERT GmbH', 'major-finding', 'https://cdm.unfccc.int/audit/inner-mongolia-2024.pdf', 'Major: additionality test failed under new policy'],
      ['AU-0013', 'Pará Mangrove Conservation', 'EcoCert Brasil', 'non-conformance', 'https://registry.verra.org/audit/para-mangrove-2023.pdf', 'Permanence buffer underfunded'],
      ['AU-0014', 'Aberdare Reforestation Initiative', 'SCS Global Services', 'compliant', 'https://registry.verra.org/audit/aberdare-2024.pdf', 'Community engagement exemplary'],
      ['AU-0015', 'Sulawesi Cookstove Program', 'Carbon Check (India)', 'major-finding', 'https://goldstandard.org/audit/sulawesi-2023.pdf', 'Major: device displacement not corroborated'],
    ];
    for (const a of audits) {
      await client.query(
        `INSERT INTO audits (audit_id, project, verifier, finding, report_url, notes, completed_at)
         VALUES ($1,$2,$3,$4,$5,$6, NOW() - ($7::int || ' days')::interval)`,
        [...a, Math.floor(Math.random() * 720) + 30]
      );
    }

    // ---------- METHODOLOGIES ----------
    const methodologies = [
      ['MTH-VM0007', 'REDD+ Methodology Framework', 'AFOLU - REDD+', 'Avoided deforestation in tropical forests', 'v1.6', 'Verra', '2020-09-15'],
      ['MTH-VM0015', 'Methodology for Avoided Unplanned Deforestation', 'AFOLU - REDD+', 'Project-scale avoided unplanned deforestation', 'v1.2', 'Verra', '2019-04-22'],
      ['MTH-VM0009', 'Methodology for Avoided Ecosystem Conversion', 'AFOLU - REDD', 'Frontier conversion ecosystems', 'v3.0', 'Verra', '2021-11-08'],
      ['MTH-VM0033', 'Methodology for Tidal Wetland and Seagrass Restoration', 'AFOLU - Blue Carbon', 'Mangrove, salt marsh, seagrass restoration', 'v2.1', 'Verra', '2023-02-14'],
      ['MTH-ARACM0003', 'Afforestation and Reforestation of Lands Except Wetlands', 'AFOLU - ARR', 'Tropical and temperate reforestation', 'v2.0', 'Verra', '2019-08-30'],
      ['MTH-ACM0002', 'Grid-Connected Electricity Generation from Renewable Sources', 'Energy Industries', 'Wind, solar, small hydro grid-connected', 'v21.0', 'Verra', '2022-06-10'],
      ['MTH-ACM0010', 'GHG Emission Reductions from Manure Management', 'Agriculture', 'Anaerobic digestion at dairy / swine farms', 'v8.0', 'Verra', '2021-03-25'],
      ['MTH-GS-TPDDTEC', 'Technologies and Practices to Displace Decentralized Thermal Energy', 'Energy Efficiency - Cookstoves', 'Improved cookstoves displacing biomass', 'v4.0', 'Gold-Standard', '2022-12-01'],
      ['MTH-GS-LUF', 'GS4GG Land Use & Forests', 'AFOLU', 'Smallholder ARR, agroforestry', 'v1.2', 'Gold-Standard', '2023-05-18'],
      ['MTH-ACR-IFM', 'Improved Forest Management on Non-Federal Lands', 'AFOLU - IFM', 'US private forestland improved management', 'v2.0', 'ACR', '2021-09-12'],
      ['MTH-ACR-GRZ', 'Avoided Conversion of Grasslands and Shrublands', 'AFOLU - ACoGS', 'North American grasslands', 'v2.1', 'ACR', '2022-04-04'],
      ['MTH-VM0042', 'Methodology for Improved Agricultural Land Management', 'Agriculture', 'Regenerative agriculture / soil C', 'v2.0', 'Verra', '2023-09-20'],
      ['MTH-VMR0007', 'Direct Air Capture with Geological Sequestration', 'CDR - DACCS', 'Engineered direct air capture + storage', 'v1.0', 'Verra', '2024-01-30'],
      ['MTH-GS-CCB', 'Climate, Community and Biodiversity Standard Add-on', 'AFOLU - Co-benefits', 'CCB validation overlay', 'v3.1', 'Gold-Standard', '2020-11-15'],
      ['MTH-ACR-SOIL', 'Compost Additions to Grazed Grasslands', 'Agriculture', 'Soil carbon via compost on rangelands', 'v1.1', 'ACR', '2022-07-22'],
    ];
    for (const m of methodologies) {
      await client.query(
        `INSERT INTO methodologies (methodology_id, name, type, scope, version, approved_by, approved_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::timestamptz)`,
        m
      );
    }

    // ---------- ISSUANCES ----------
    const issuances = [
      ['IS-2019-0001', 'Katingan Mentaya Peatland Restoration', 2019, 1850000, 'VM0007', 'Verra'],
      ['IS-2020-0014', 'Jari Pará REDD+ Project', 2020, 920000, 'VM0015', 'Verra'],
      ['IS-2021-0027', 'Kasigau Corridor REDD+', 2021, 1200000, 'VM0009', 'Verra'],
      ['IS-2022-0033', 'Cordillera Azul National Park REDD+', 2022, 3100000, 'VM0015', 'Verra'],
      ['IS-2018-0041', 'Rimba Raya Biodiversity Reserve', 2018, 760000, 'VM0007', 'Verra'],
      ['IS-2023-0058', 'Mata Atlântica Reforestation', 2023, 42000, 'AR-ACM0003', 'Verra'],
      ['IS-2022-0062', 'Kenya Improved Cookstoves', 2022, 185000, 'GS-TPDDTEC', 'Gold-Standard'],
      ['IS-2023-0077', 'Sumatra Mangrove Blue Carbon', 2023, 28000, 'VM0033', 'Verra'],
      ['IS-2021-0083', 'Madre de Dios Amazon REDD', 2021, 540000, 'VM0015', 'Verra'],
      ['IS-2024-0091', 'California Methane Capture - Dairy', 2024, 75000, 'ACM0010', 'ACR'],
      ['IS-2022-0104', 'Gujarat Wind Power Project', 2022, 105000, 'ACM0002', 'Verra'],
      ['IS-2020-0128', 'Pará Mangrove Conservation', 2020, 31000, 'VM0033', 'Verra'],
      ['IS-2023-0139', 'Aberdare Reforestation Initiative', 2023, 18500, 'AR-ACM0003', 'Verra'],
      ['IS-2019-0145', 'Sulawesi Cookstove Program', 2019, 92000, 'GS-TPDDTEC', 'Gold-Standard'],
      ['IS-2024-0001', 'Katingan Mentaya Peatland Restoration', 2024, 1450000, 'VM0007', 'Verra'],
    ];
    for (const i of issuances) {
      await client.query(
        `INSERT INTO issuances (issuance_id, project, vintage_year, tons_issued, methodology, issued_by, issued_at, notes)
         VALUES ($1,$2,$3,$4,$5,$6, NOW() - ($7::int || ' days')::interval, $8)`,
        [...i, Math.floor(Math.random() * 1500) + 30, 'Issued upon completion of monitoring period and third-party verification']
      );
    }

    // ---------- RETIREMENTS ----------
    const retirements = [
      ['RT-0001', 250000, 'Microsoft Corporation', 'Operational scope-2 offset 2024', 'https://registry.verra.org/cert/RT-0001.pdf'],
      ['RT-0002', 180000, 'Alphabet Inc.', 'Google Cloud carbon-neutral 2023', 'https://registry.verra.org/cert/RT-0002.pdf'],
      ['RT-0003', 50000, 'Salesforce Inc.', 'Net-zero residual 2024', 'https://registry.verra.org/cert/RT-0003.pdf'],
      ['RT-0004', 320000, 'Shell plc', 'Voluntary buffer Q3', 'https://registry.verra.org/cert/RT-0004.pdf'],
      ['RT-0005', 12500, 'Stripe Climate', 'Frontier DAC pilot tranche A', 'https://registry.verra.org/cert/RT-0005.pdf'],
      ['RT-0006', 8000, 'Allianz Climate Solutions', 'Insurance portfolio offset 2024', 'https://registry.verra.org/cert/RT-0006.pdf'],
      ['RT-0007', 200, 'Jane Doe', 'Personal carbon-neutral lifestyle', 'https://registry.verra.org/cert/RT-0007.pdf'],
      ['RT-0008', 145000, 'Microsoft Corporation', 'Azure datacentre Scope-2 (EU)', 'https://registry.verra.org/cert/RT-0008.pdf'],
      ['RT-0009', 95000, 'Salesforce Inc.', 'Annual transition plan target 2024', 'https://registry.verra.org/cert/RT-0009.pdf'],
      ['RT-0010', 60000, 'Carbon Streaming Corp', 'Strategic retirement Q1', 'https://registry.verra.org/cert/RT-0010.pdf'],
      ['RT-0011', 410000, 'Shell plc', 'Refining footprint Q2', 'https://registry.verra.org/cert/RT-0011.pdf'],
      ['RT-0012', 18000, 'Vertree Partners', 'Client offsetting bundle', 'https://registry.verra.org/cert/RT-0012.pdf'],
    ];
    for (const r of retirements) {
      await client.query(
        `INSERT INTO retirements (retirement_id, credits_amount, beneficiary, claim, certificate_url, retired_at)
         VALUES ($1,$2,$3,$4,$5, NOW() - ($6::int || ' days')::interval)`,
        [...r, Math.floor(Math.random() * 700) + 20]
      );
    }

    // ---------- BENEFICIARIES ----------
    const beneficiaries = [
      ['BN-0001', 'Microsoft Corporation', 'corporate', 'United States', 2024],
      ['BN-0002', 'Alphabet Inc.', 'corporate', 'United States', 2023],
      ['BN-0003', 'Salesforce Inc.', 'corporate', 'United States', 2024],
      ['BN-0004', 'Shell plc', 'corporate', 'United Kingdom', 2024],
      ['BN-0005', 'Stripe Climate', 'corporate', 'United States', 2024],
      ['BN-0006', 'Allianz Climate Solutions', 'corporate', 'Germany', 2024],
      ['BN-0007', 'Jane Doe', 'individual', 'Australia', 2024],
      ['BN-0008', 'Hartono Wibowo', 'individual', 'Indonesia', 2023],
      ['BN-0009', 'BP plc', 'corporate', 'United Kingdom', 2024],
      ['BN-0010', 'NatureVest Carbon Fund', 'corporate', 'United States', 2024],
      ['BN-0011', 'Carbon Streaming Corp', 'corporate', 'Canada', 2024],
      ['BN-0012', 'Vertree Partners', 'corporate', 'United Kingdom', 2024],
    ];
    for (const b of beneficiaries) {
      await client.query(
        `INSERT INTO beneficiaries (beneficiary_id, name, type, country, reported_use_year) VALUES ($1,$2,$3,$4,$5)`,
        b
      );
    }

    // ---------- SCOPES_EMISSIONS ----------
    const scopes = [
      ['SE-0001', 'Microsoft Corporation', 2024, '1', 130000, 'GHG-Protocol Corp', true],
      ['SE-0002', 'Microsoft Corporation', 2024, '2', 5800000, 'GHG-Protocol market-based', true],
      ['SE-0003', 'Microsoft Corporation', 2024, '3', 14500000, 'GHG-Protocol Scope-3', true],
      ['SE-0004', 'Alphabet Inc.', 2024, '1', 110000, 'GHG-Protocol Corp', true],
      ['SE-0005', 'Alphabet Inc.', 2024, '2', 3100000, 'GHG-Protocol market-based', true],
      ['SE-0006', 'Alphabet Inc.', 2024, '3', 11800000, 'GHG-Protocol Scope-3', true],
      ['SE-0007', 'Shell plc', 2024, '1', 62000000, 'IPIECA', true],
      ['SE-0008', 'Shell plc', 2024, '2', 3100000, 'GHG-Protocol market-based', true],
      ['SE-0009', 'Shell plc', 2024, '3', 1200000000, 'GHG-Protocol Scope-3', false],
      ['SE-0010', 'BP plc', 2024, '1', 31000000, 'IPIECA', true],
      ['SE-0011', 'Stripe Climate', 2024, '1', 1200, 'GHG-Protocol Corp', true],
      ['SE-0012', 'Stripe Climate', 2024, '2', 38000, 'GHG-Protocol market-based', true],
      ['SE-0013', 'Salesforce Inc.', 2024, '2', 250000, 'GHG-Protocol market-based', true],
      ['SE-0014', 'Allianz Climate Solutions', 2024, '3', 8400000, 'PCAF', false],
      ['SE-0015', 'Carbon Streaming Corp', 2024, '1', 800, 'GHG-Protocol Corp', true],
    ];
    for (const s of scopes) {
      await client.query(
        `INSERT INTO scopes_emissions (scope_id, holder, year, scope, emissions_tco2e, methodology, verified)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`, s
      );
    }

    // ---------- SCOREBOARD ----------
    const scoreboard = [
      ['SB-0001', 'Katingan Mentaya Peatland Restoration', 'yes', 'AAA', 'A+'],
      ['SB-0002', 'Jari Pará REDD+ Project', 'pending', 'AA', 'A'],
      ['SB-0003', 'Kasigau Corridor REDD+', 'yes', 'AA', 'A'],
      ['SB-0004', 'Cordillera Azul National Park REDD+', 'yes', 'AAA', 'A+'],
      ['SB-0005', 'Rimba Raya Biodiversity Reserve', 'no', 'BB', 'B'],
      ['SB-0006', 'Mata Atlântica Reforestation', 'yes', 'AA', 'A'],
      ['SB-0007', 'Kenya Improved Cookstoves', 'no', 'BBB', 'B'],
      ['SB-0008', 'Sumatra Mangrove Blue Carbon', 'pending', 'A', 'A'],
      ['SB-0009', 'Madre de Dios Amazon REDD', 'yes', 'A', 'A'],
      ['SB-0010', 'California Methane Capture - Dairy', 'yes', 'AA', 'A'],
      ['SB-0011', 'Gujarat Wind Power Project', 'no', 'C', 'C'],
      ['SB-0012', 'Inner Mongolia Solar Array', 'no', 'D', 'C'],
      ['SB-0013', 'Pará Mangrove Conservation', 'pending', 'A', 'A'],
      ['SB-0014', 'Aberdare Reforestation Initiative', 'yes', 'AA', 'A'],
      ['SB-0015', 'Sulawesi Cookstove Program', 'no', 'C', 'B'],
    ];
    for (const s of scoreboard) {
      await client.query(
        `INSERT INTO scoreboard (score_id, project, ccp_eligible, sylvera_grade, btn_grade, last_updated)
         VALUES ($1,$2,$3,$4,$5, NOW() - ($6::int || ' days')::interval)`,
        [...s, Math.floor(Math.random() * 180) + 5]
      );
    }

    // ---------- JURISDICTIONAL_BASELINES ----------
    const baselines = [
      ['JB-0001', 'Indonesia - Central Kalimantan', 'forestry-REDD+', 2020, 144000000, 'FREL submission to UNFCCC, 2020'],
      ['JB-0002', 'Brazil - Pará', 'forestry-REDD+', 2020, 230000000, 'INPE PRODES baseline'],
      ['JB-0003', 'Kenya - Coast Province', 'forestry-REDD+', 2019, 4500000, 'KFS National Forest Resources Assessment'],
      ['JB-0004', 'Peru - Madre de Dios', 'forestry-REDD+', 2020, 14000000, 'MINAM REDD+ FREL 2020'],
      ['JB-0005', 'Brazil - São Paulo', 'reforestation', 2021, 1500000, 'SOS Mata Atlântica Atlas'],
      ['JB-0006', 'Kenya - Aberdare', 'reforestation', 2022, 850000, 'KFS Aberdare Restoration Plan'],
      ['JB-0007', 'Indonesia - Riau', 'blue-carbon', 2023, 980000, 'KKP National Mangrove Map'],
      ['JB-0008', 'United States - California', 'methane-capture', 2024, 2700000, 'CARB Dairy Digester baseline'],
      ['JB-0009', 'India - Gujarat', 'renewables', 2022, 88000000, 'CEA Grid Emission Factor 2022'],
      ['JB-0010', 'China - Inner Mongolia', 'renewables', 2023, 410000000, 'NDRC Grid Emission Factor 2023'],
      ['JB-0011', 'Brazil - Amazon Delta', 'blue-carbon', 2022, 2200000, 'CI Brazil mangrove inventory'],
    ];
    for (const b of baselines) {
      await client.query(
        `INSERT INTO jurisdictional_baselines (baseline_id, jurisdiction, sector, year, baseline_tco2e, reference)
         VALUES ($1,$2,$3,$4,$5,$6)`, b
      );
    }

    // ---------- SATELLITE_IMAGERY ----------
    const imagery = [
      ['SI-0001', 'Katingan Mentaya Peatland Restoration', 'Sentinel-2', 0.812, 0.34],
      ['SI-0002', 'Jari Pará REDD+ Project', 'Landsat', 0.760, -0.18],
      ['SI-0003', 'Kasigau Corridor REDD+', 'Planet', 0.620, -0.62],
      ['SI-0004', 'Cordillera Azul National Park REDD+', 'Sentinel-2', 0.840, 0.05],
      ['SI-0005', 'Rimba Raya Biodiversity Reserve', 'Sentinel-2', 0.795, -0.92],
      ['SI-0006', 'Mata Atlântica Reforestation', 'Planet', 0.701, 1.45],
      ['SI-0007', 'Sumatra Mangrove Blue Carbon', 'Sentinel-2', 0.687, 2.18],
      ['SI-0008', 'Madre de Dios Amazon REDD', 'Landsat', 0.778, -0.20],
      ['SI-0009', 'Pará Mangrove Conservation', 'Planet', 0.654, 0.83],
      ['SI-0010', 'Aberdare Reforestation Initiative', 'Sentinel-2', 0.591, 3.24],
    ];
    for (const im of imagery) {
      await client.query(
        `INSERT INTO satellite_imagery (image_id, project, captured_at, source, ndvi_avg, area_change_pct)
         VALUES ($1,$2, NOW() - ($6::int || ' days')::interval, $3,$4,$5)`,
        [...im, Math.floor(Math.random() * 365) + 10]
      );
    }

    // ---------- SMR_REPORTS ----------
    const smr = [
      ['SMR-0001', 'Katingan Mentaya Peatland Restoration', '2023-01-01', '2023-12-31', 1620000],
      ['SMR-0002', 'Jari Pará REDD+ Project', '2023-01-01', '2023-12-31', 880000],
      ['SMR-0003', 'Kasigau Corridor REDD+', '2023-01-01', '2023-12-31', 1100000],
      ['SMR-0004', 'Cordillera Azul National Park REDD+', '2023-01-01', '2023-12-31', 2950000],
      ['SMR-0005', 'Mata Atlântica Reforestation', '2023-01-01', '2023-12-31', 38000],
      ['SMR-0006', 'Kenya Improved Cookstoves', '2023-01-01', '2023-12-31', 175000],
      ['SMR-0007', 'Sumatra Mangrove Blue Carbon', '2023-01-01', '2023-12-31', 26000],
      ['SMR-0008', 'Madre de Dios Amazon REDD', '2023-01-01', '2023-12-31', 515000],
      ['SMR-0009', 'California Methane Capture - Dairy', '2024-01-01', '2024-06-30', 39000],
      ['SMR-0010', 'Gujarat Wind Power Project', '2023-01-01', '2023-12-31', 102000],
      ['SMR-0011', 'Aberdare Reforestation Initiative', '2023-01-01', '2023-12-31', 17500],
    ];
    for (const s of smr) {
      await client.query(
        `INSERT INTO smr_reports (smr_id, project, period_start, period_end, monitored_tco2e, submitted_at)
         VALUES ($1,$2,$3::date,$4::date,$5, NOW() - ($6::int || ' days')::interval)`,
        [...s, Math.floor(Math.random() * 200) + 30]
      );
    }

    // ---------- CLAIMS ----------
    const claims = [
      ['CL-0001', 'Microsoft Corporation', 'net-zero', '1+2+3', 2030, true],
      ['CL-0002', 'Alphabet Inc.', 'net-zero', '1+2+3', 2030, true],
      ['CL-0003', 'Salesforce Inc.', 'net-zero', '1+2', 2025, true],
      ['CL-0004', 'Shell plc', 'net-zero', 'partial', 2050, false],
      ['CL-0005', 'BP plc', 'carbon-neutral', '1+2', 2025, false],
      ['CL-0006', 'Stripe Climate', 'SBTi', '1+2+3', 2040, true],
      ['CL-0007', 'NatureVest Carbon Fund', 'carbon-neutral', '1+2', 2024, true],
      ['CL-0008', 'Allianz Climate Solutions', 'SBTi', '1+2+3', 2050, true],
      ['CL-0009', 'Carbon Streaming Corp', 'carbon-neutral', '1+2', 2024, true],
      ['CL-0010', 'Vertree Partners', 'carbon-neutral', '1+2', 2024, false],
    ];
    for (const c of claims) {
      await client.query(
        `INSERT INTO claims (claim_id, holder, type, scope, year, third_party_verified) VALUES ($1,$2,$3,$4,$5,$6)`, c
      );
    }

    // ---------- BIODIVERSITY_COBENEFITS ----------
    const cobenefits = [
      ['CO-0001', 'Katingan Mentaya Peatland Restoration', 'species-count', 145, 178],
      ['CO-0002', 'Jari Pará REDD+ Project', 'habitat-area', 414900, 414000],
      ['CO-0003', 'Kasigau Corridor REDD+', 'species-count', 220, 268],
      ['CO-0004', 'Cordillera Azul National Park REDD+', 'habitat-area', 1351964, 1351600],
      ['CO-0005', 'Rimba Raya Biodiversity Reserve', 'species-count', 95, 102],
      ['CO-0006', 'Mata Atlântica Reforestation', 'habitat-area', 12500, 13200],
      ['CO-0007', 'Sumatra Mangrove Blue Carbon', 'habitat-area', 8400, 9100],
      ['CO-0008', 'Madre de Dios Amazon REDD', 'water-quality', 0.62, 0.78],
      ['CO-0009', 'Pará Mangrove Conservation', 'habitat-area', 18200, 18600],
      ['CO-0010', 'Aberdare Reforestation Initiative', 'water-quality', 0.55, 0.72],
    ];
    for (const c of cobenefits) {
      await client.query(
        `INSERT INTO biodiversity_cobenefits (co_id, project, indicator, baseline, current) VALUES ($1,$2,$3,$4,$5)`, c
      );
    }

    // ---------- FINANCE_LEDGER ----------
    const ledger = [
      ['LG-0001', 'Microsoft Corporation', 'TX-0001', 250000, 0, 1250000],
      ['LG-0002', 'South Pole Group', 'TX-0001', 0, 250000, 250000],
      ['LG-0003', 'South Pole Group', 'TX-0002', 180000, 0, 70000],
      ['LG-0004', 'Alphabet Inc.', 'TX-0002', 0, 180000, 920000],
      ['LG-0005', 'Shell plc', 'TX-0003', 500000, 0, 1100000],
      ['LG-0006', 'Climate Impact Partners', 'TX-0003', 0, 500000, 500000],
      ['LG-0007', 'NatureVest Carbon Fund', 'TX-0004', 95000, 0, 305000],
      ['LG-0008', 'Salesforce Inc.', 'TX-0004', 0, 95000, 295000],
      ['LG-0009', 'Carbon Streaming Corp', 'TX-0006', 145000, 0, 455000],
      ['LG-0010', 'Microsoft Corporation', 'TX-0006', 0, 145000, 1395000],
      ['LG-0011', 'Stripe Climate', 'TX-0013', 8500, 0, 4500],
      ['LG-0012', 'Allianz Climate Solutions', 'TX-0013', 0, 8500, 28500],
    ];
    for (const l of ledger) {
      await client.query(
        `INSERT INTO finance_ledger (ledger_id, holder, transaction, debit_credits, credit_credits, balance_credits, ts)
         VALUES ($1,$2,$3,$4,$5,$6, NOW() - ($7::int || ' days')::interval)`,
        [...l, Math.floor(Math.random() * 360) + 5]
      );
    }

    // ---------- NOTIFICATIONS (seed a few) ----------
    const notifs = [
      [null, 'fraud-alert', 'High fraud risk (85)', 'TX-0008 flagged for KYC failure pattern'],
      [null, 'audit-finding', 'Major finding on Inner Mongolia Solar', 'Additionality test failed under new policy'],
      [null, 'retirement', 'Retirement RT-0001', '250,000 tCO2e retired for Microsoft Corporation'],
      [null, 'retirement', 'Retirement RT-0005', '12,500 tCO2e retired for Stripe Climate'],
      [null, 'fraud-alert', 'High fraud risk (72)', 'TX-0015 double-issuance pattern detected'],
    ];
    for (const n of notifs) {
      await client.query(
        `INSERT INTO notifications (user_email, type, title, body, created_at) VALUES ($1,$2,$3,$4, NOW() - ($5::int || ' hours')::interval)`,
        [...n, Math.floor(Math.random() * 72) + 1]
      );
    }

    console.log('[seed] complete');
  } catch (err) {
    console.error('[seed] error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
