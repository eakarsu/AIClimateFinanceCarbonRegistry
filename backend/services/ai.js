const { OPENROUTER_API_KEY, OPENROUTER_MODEL } = require('../config/openrouter');

const REGISTRY_SYSTEM_PROMPT =
  'You are an expert voluntary carbon market analyst, MRV specialist, and registry integrity officer. ' +
  'You apply rigorous standards (Verra VCS, Gold Standard, ACR) and structured reasoning grounded in CCQI/ICVCM Core Carbon Principles. ' +
  'Always return STRICT, MINIFIED JSON matching the requested schema. No prose outside JSON.';

async function callOpenRouter(systemPrompt, userPrompt) {
  if (!OPENROUTER_API_KEY) {
    return { error: 'OPENROUTER_API_KEY not configured' };
  }
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3040',
        'X-Title': 'AI Climate Finance / Carbon Registry',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });
    const data = await res.json();
    if (data.error) return { error: data.error.message || 'OpenRouter API error' };
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    return { error: err.message };
  }
}

// 3-strategy JSON parser
function safeJsonParse(response, fallback) {
  if (response && typeof response === 'object' && response.error) {
    return { ...fallback, error: response.error };
  }
  if (response == null) return { ...fallback, summary: '' };
  if (typeof response === 'object') return response;
  const text = String(response).trim();

  try { return JSON.parse(text); } catch (_) { /* fall */ }

  try {
    const start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0, inStr = false, escape = false;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) return JSON.parse(text.slice(start, i + 1));
        }
      }
    }
  } catch (_) { /* fall */ }

  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1]) return JSON.parse(fenced[1].trim());
  } catch (_) { /* fall */ }

  return { ...fallback, summary: text };
}

// ─── 1. AI Verify Project ───
async function verifyProject(project) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "additionality": { "verdict": "additional"|"non-additional"|"borderline", "score": number, "rationale": string, "tests_passed": [string], "tests_failed": [string] },
  "leakage": { "risk_level": "low"|"medium"|"high", "leakage_belt_pct_estimate": number, "drivers": [string], "mitigations": [string] },
  "permanence": { "buffer_pool_pct_recommended": number, "risk_horizon_years": number, "reversal_risks": [string], "monitoring_plan_strength": "strong"|"adequate"|"weak" },
  "overall_recommendation": "approve"|"approve-with-conditions"|"reject",
  "conditions": [string],
  "summary": string
}`;
  const user = `Evaluate this carbon project for additionality, leakage, and permanence:\n${JSON.stringify(project, null, 2)}`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { overall_recommendation: 'approve-with-conditions', summary: '' });
}

// ─── 2. AI Synthesize MRV ───
async function synthesizeMRV(project) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "mrv_report": {
    "baseline_methodology": string,
    "monitoring_period": string,
    "data_sources": [string],
    "estimated_annual_reductions_tco2e": number,
    "uncertainty_pct": number
  },
  "monitoring_plan": [{ "indicator": string, "frequency": string, "method": string, "responsible_party": string }],
  "qa_qc_procedures": [string],
  "reporting_schedule": [{ "milestone": string, "due_date": string }],
  "summary": string
}`;
  const user = `Draft an MRV report and monitoring plan for:\n${JSON.stringify(project, null, 2)}`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

// ─── 3. AI Detect Fraud ───
async function detectFraud(transaction) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "fraud_risk_score": number,
  "risk_band": "low"|"medium"|"high"|"critical",
  "anomaly_signals": [{ "signal": string, "weight": number, "evidence": string }],
  "patterns_detected": [string],
  "recommended_action": "approve"|"manual-review"|"freeze"|"reject",
  "kyc_flags": [string],
  "double_counting_risk": "none"|"possible"|"likely",
  "summary": string
}`;
  const user = `Score fraud risk for this carbon-credit transaction:\n${JSON.stringify(transaction, null, 2)}`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { fraud_risk_score: 50, risk_band: 'medium', summary: '' });
}

// ─── 4. AI Analyze Pricing ───
async function analyzePricing(projectType, vintage) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "current_market_band_usd_per_ton": { "low": number, "mid": number, "high": number },
  "forecast_12mo_usd_per_ton": { "low": number, "mid": number, "high": number },
  "market_drivers": [{ "driver": string, "direction": "up"|"down"|"mixed", "strength": "low"|"medium"|"high" }],
  "comparable_indices": [string],
  "premium_signals": [string],
  "discount_signals": [string],
  "summary": string
}`;
  const user = `Forecast voluntary-carbon-market pricing for project_type=${projectType}, vintage=${vintage}.`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

// ─── 5. AI Map Methodology ───
async function mapMethodology(project) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "applicable_methodologies": [{ "methodology_id": string, "name": string, "approved_by": string, "fit_score": number, "rationale": string }],
  "compliance_gaps": [{ "requirement": string, "status": "met"|"partially-met"|"unmet", "remediation": string }],
  "recommended_methodology": string,
  "estimated_certification_months": number,
  "summary": string
}`;
  const user = `Identify applicable methodologies and compliance gaps for:\n${JSON.stringify(project, null, 2)}`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

// ─── 6. AI Draft Disclosure (TCFD) ───
async function draftDisclosure(holder) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Draft a TCFD-aligned climate disclosure for a credit holder.
Schema:
{
  "governance": string,
  "strategy": { "transition_plan_summary": string, "scenario_analysis": string },
  "risk_management": { "physical_risks": [string], "transition_risks": [string], "process": string },
  "metrics_and_targets": { "scope1_2_3_disclosure": string, "carbon_credits_used_tco2e": number, "removal_vs_avoidance_split": string, "interim_targets": [string] },
  "summary": string
}`;
  const user = `Draft a TCFD disclosure for this holder, given their carbon-registry activity:\n${JSON.stringify(holder, null, 2)}`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

// ─── 7. AI Leakage Modeler ───
async function leakageModeler(project) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "leakage_model": { "type": "activity-shifting"|"market-leakage"|"ecological"|"mixed", "expected_leakage_pct": number, "spatial_horizon_km": number, "time_horizon_years": number },
  "sensitivity": [{ "driver": string, "elasticity": number, "direction": "amplifies"|"dampens" }],
  "leakage_belt_recommendation": { "radius_km": number, "monitoring_indicators": [string] },
  "summary": string
}`;
  const user = `Model leakage for this project:\n${JSON.stringify(project, null, 2)}`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

// ─── 8. AI Satellite MRV ───
async function satelliteMRV(project, imagery_period) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "mrv_signal": { "deforestation_alerts": number, "ndvi_delta": number, "canopy_loss_ha": number, "confidence": number },
  "imagery_used": [{ "source": string, "scene_count": number, "cloud_cover_avg_pct": number }],
  "anomalies": [string],
  "recommended_ground_truth": [string],
  "summary": string
}`;
  const user = `Derive an MRV signal from satellite imagery for project ${JSON.stringify(project)} over period ${imagery_period}.`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

// ─── 9. AI Double-Counting Detect ───
async function doubleCountingDetect(credit) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "double_counting_risk": "none"|"low"|"medium"|"high",
  "cross_registry_pivots": [{ "registry": string, "match_signal": string, "confidence": number }],
  "serial_number_collisions": [string],
  "corresponding_adjustment_status": "applied"|"pending"|"not-applicable",
  "summary": string
}`;
  const user = `Inspect this credit for double-counting risk across registries:\n${JSON.stringify(credit, null, 2)}`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

// ─── 10. AI Additionality Scorer ───
async function additionalityScorer(project) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "additionality_score": number,
  "verdict": "additional"|"borderline"|"non-additional",
  "counterfactual": { "baseline_scenario": string, "without_project_emissions_tco2e": number, "rationale": string },
  "tests": [{ "name": "investment"|"barrier"|"common-practice"|"regulatory", "passed": boolean, "evidence": string }],
  "summary": string
}`;
  const user = `Score additionality with explicit counterfactual for:\n${JSON.stringify(project, null, 2)}`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

// ─── 11. AI Registry Arbitrage ───
async function registryArbitrage(project_type) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "registries_compared": [{ "registry": string, "indicative_usd_per_ton": number, "volume_traded_kt": number }],
  "spreads": [{ "pair": string, "spread_usd": number }],
  "drivers": [{ "driver": string, "direction": "widens"|"narrows" }],
  "arbitrage_recommendation": string,
  "summary": string
}`;
  const user = `Compare cross-registry pricing for project_type=${project_type} across Verra, Gold Standard, ACR, CAR.`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

// ─── 12. AI Price Discovery ───
async function priceDiscovery(project_type, vintage) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "price_band_usd_per_ton": { "low": number, "mid": number, "high": number },
  "signals": [{ "signal": string, "weight": number, "direction": "up"|"down" }],
  "comparable_trades": [{ "registry": string, "vintage": number, "price": number, "size_kt": number }],
  "liquidity_score": number,
  "summary": string
}`;
  const user = `Discover price for project_type=${project_type}, vintage=${vintage} using comparables and signals.`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

// ─── 13. AI Biodiversity Co-Benefit ───
async function biodiversityCoBenefit(project) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "biodiversity_score": number,
  "indicators": [{ "name": "species-count"|"habitat-area"|"water-quality"|"connectivity", "baseline": number, "current": number, "delta_pct": number }],
  "iucn_red_list_overlap": [string],
  "ccb_standard_eligibility": "eligible"|"partial"|"ineligible",
  "summary": string
}`;
  const user = `Score biodiversity co-benefits for:\n${JSON.stringify(project, null, 2)}`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

// ─── 14. AI Climate Claim Validator ───
async function climateClaimValidator(claim) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "validity": "valid"|"qualified"|"misleading"|"invalid",
  "greenwashing_risk": number,
  "issues_found": [{ "issue": string, "severity": "low"|"medium"|"high", "remediation": string }],
  "standard_alignment": [{ "standard": "SBTi"|"VCMI"|"ISO-14068"|"FTC-Green-Guides", "aligned": boolean }],
  "summary": string
}`;
  const user = `Validate this corporate climate claim:\n${JSON.stringify(claim, null, 2)}`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

// ─── 15. AI Supply Cap Forecast ───
async function supplyCapForecast(project_type) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "supply_forecast_mt_co2e": { "y0": number, "y1": number, "y3": number, "y5": number },
  "cap_shortfall_risk": "low"|"medium"|"high",
  "drivers": [{ "driver": string, "impact_mt": number }],
  "policy_levers": [string],
  "summary": string
}`;
  const user = `Forecast supply curve and cap-shortfall risk for project_type=${project_type} over 5 years.`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

// ─── 16. AI Scope-3 Attributor ───
async function scope3Attributor(holder) {
  const sys = `${REGISTRY_SYSTEM_PROMPT}
Schema:
{
  "scope3_total_tco2e": number,
  "by_category": [{ "category": "purchased-goods"|"capital-goods"|"fuel-energy"|"upstream-transport"|"waste"|"business-travel"|"employee-commuting"|"upstream-leased"|"downstream-transport"|"processing"|"use-of-sold"|"end-of-life"|"downstream-leased"|"franchises"|"investments", "tco2e": number, "share_pct": number }],
  "data_quality": "primary"|"secondary"|"hybrid",
  "hotspots": [string],
  "summary": string
}`;
  const user = `Attribute scope-3 emissions by GHG-Protocol category for this holder:\n${JSON.stringify(holder, null, 2)}`;
  const r = await callOpenRouter(sys, user);
  return safeJsonParse(r, { summary: '' });
}

module.exports = {
  callOpenRouter,
  safeJsonParse,
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
};
