import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const features = [
  // Registry CRUD
  { path: '/projects', title: 'Projects', desc: 'Registered carbon projects', statKey: 'projects' },
  { path: '/credits', title: 'Credits', desc: 'tCO2e credits with vintages', statKey: 'credits' },
  { path: '/holders', title: 'Holders', desc: 'Corporates, brokers, funds', statKey: 'holders' },
  { path: '/verifiers', title: 'Verifiers (VVBs)', desc: 'Accredited validation bodies', statKey: 'verifiers' },
  { path: '/transactions', title: 'Transactions', desc: 'Credit transfers + prices', statKey: 'transactions' },
  { path: '/audits', title: 'Audits', desc: 'Verifier visits & findings', statKey: 'audits' },
  { path: '/methodologies', title: 'Methodologies', desc: 'Approved VM/AR/AC methodologies', statKey: 'methodologies' },
  { path: '/issuances', title: 'Issuances', desc: 'Per-vintage credit issuance events', statKey: 'issuances' },
  { path: '/retirements', title: 'Retirements', desc: 'Permanent retirements + certificates', statKey: 'retirements' },
  { path: '/beneficiaries', title: 'Beneficiaries', desc: 'Named retirement beneficiaries', statKey: 'beneficiaries' },
  { path: '/scopes-emissions', title: 'Scope Emissions', desc: 'GHG-Protocol scope 1/2/3 inventory', statKey: 'scopes_emissions' },
  { path: '/scoreboard', title: 'Scoreboard', desc: 'CCP / Sylvera / BTN ratings', statKey: 'scoreboard' },
  { path: '/jurisdictional-baselines', title: 'Baselines', desc: 'National/subnational FRELs', statKey: 'jurisdictional_baselines' },
  { path: '/satellite-imagery', title: 'Satellite Imagery', desc: 'Sentinel-2 / Landsat / Planet scenes', statKey: 'satellite_imagery' },
  { path: '/smr-reports', title: 'SMR Reports', desc: 'Monitoring & reporting periods', statKey: 'smr_reports' },
  { path: '/claims', title: 'Claims', desc: 'Net-zero / SBTi / carbon-neutral claims', statKey: 'claims' },
  { path: '/biodiversity-cobenefits', title: 'Biodiversity', desc: 'Co-benefit indicators per project', statKey: 'biodiversity_cobenefits' },
  { path: '/finance-ledger', title: 'Finance Ledger', desc: 'Double-entry credit ledger', statKey: 'finance_ledger' },

  // AI Studio
  { path: '/ai/verify-project',         title: 'AI Verify Project',        desc: 'Additionality / leakage / permanence' },
  { path: '/ai/synthesize-mrv',         title: 'AI Synthesize MRV',        desc: 'MRV report + monitoring plan' },
  { path: '/ai/detect-fraud',           title: 'AI Detect Fraud',          desc: 'Transaction risk + KYC flags' },
  { path: '/ai/analyze-pricing',        title: 'AI Analyze Pricing',       desc: 'VCM price bands + drivers' },
  { path: '/ai/map-methodology',        title: 'AI Map Methodology',       desc: 'Auto-match methodologies' },
  { path: '/ai/draft-disclosure',       title: 'AI Draft Disclosure',      desc: 'TCFD-aligned drafts' },
  { path: '/ai/leakage-modeler',        title: 'AI Leakage Modeler',       desc: 'Quantify leakage + sensitivity' },
  { path: '/ai/satellite-mrv',          title: 'AI Satellite MRV',         desc: 'MRV from satellite imagery' },
  { path: '/ai/double-counting-detect', title: 'AI Double-Counting',       desc: 'Cross-registry pivots' },
  { path: '/ai/additionality-scorer',   title: 'AI Additionality Scorer',  desc: 'Counterfactual baseline' },
  { path: '/ai/registry-arbitrage',     title: 'AI Registry Arbitrage',    desc: 'Cross-registry spreads' },
  { path: '/ai/price-discovery',        title: 'AI Price Discovery',       desc: 'Price + liquidity from comparables' },
  { path: '/ai/biodiversity-co-benefit',title: 'AI Biodiversity Co-Benefit', desc: 'Biodiversity impact score' },
  { path: '/ai/climate-claim-validator',title: 'AI Climate Claim Validator', desc: 'Greenwashing risk + standards' },
  { path: '/ai/supply-cap-forecast',    title: 'AI Supply Cap Forecast',   desc: '5-year supply + cap shortfall' },
  { path: '/ai/scope-3-attributor',     title: 'AI Scope-3 Attributor',    desc: '15-category scope-3 attribution' },

  // Ops
  { path: '/notifications', title: 'Notifications', desc: 'Fraud / audit / retirement alerts', statKey: 'unread_notifications' },
  { path: '/webhooks',      title: 'Webhooks',      desc: 'HMAC-signed event subscriptions' },
  { path: '/bulk-import',   title: 'Bulk Import',   desc: 'CSV-driven entity ingestion' },
];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch((e) => console.warn('stats fetch failed:', e.message));
  }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h2>CarbonLedger AI Dashboard</h2>
        <p>Voluntary carbon market registry, MRV automation, fraud detection, RBAC, webhooks, and pricing intelligence.</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="label">Total Projects</div>
            <div className="value">{stats.projects}</div>
            <div className="sub">across 6+ project types</div>
          </div>
          <div className="stat-card">
            <div className="label">Credits Outstanding</div>
            <div className="value">{stats.credits}</div>
            <div className="sub">{(Number(stats.total_tons_co2e) || 0).toLocaleString()} tCO2e total</div>
          </div>
          <div className="stat-card">
            <div className="label">Retirements</div>
            <div className="value">{stats.retirements}</div>
            <div className="sub">permanent cancellations</div>
          </div>
          <div className="stat-card">
            <div className="label">Holders</div>
            <div className="value">{stats.holders}</div>
            <div className="sub">{stats.verifiers} verifiers</div>
          </div>
          <div className="stat-card">
            <div className="label">Avg Price (settled)</div>
            <div className="value">${Number(stats.avg_price_usd_per_ton || 0).toFixed(2)}</div>
            <div className="sub">per tCO2e</div>
          </div>
          <div className="stat-card">
            <div className="label">Major Findings</div>
            <div className="value" style={{ color: stats.major_findings > 0 ? '#dc2626' : 'inherit' }}>{stats.major_findings}</div>
            <div className="sub">from {stats.audits} audits</div>
          </div>
          <div className="stat-card">
            <div className="label">Scope Emissions</div>
            <div className="value">{stats.scopes_emissions}</div>
            <div className="sub">{stats.claims} claims tracked</div>
          </div>
          <div className="stat-card">
            <div className="label">Unread Alerts</div>
            <div className="value" style={{ color: stats.unread_notifications > 0 ? '#ef4444' : 'inherit' }}>{stats.unread_notifications}</div>
            <div className="sub">{stats.satellite_imagery} satellite scenes</div>
          </div>
        </div>
      )}

      <div className="feature-grid">
        {features.map((f) => (
          <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            {stats && f.statKey && stats[f.statKey] !== undefined && (
              <div className="tag">{stats[f.statKey]} records</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
