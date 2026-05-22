import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout, currentUser, getUnreadNotifications } from '../services/api';

const crudLinks = [
  { path: '/projects', label: 'Projects', icon: 'P' },
  { path: '/credits', label: 'Credits', icon: 'C' },
  { path: '/holders', label: 'Holders', icon: 'H' },
  { path: '/verifiers', label: 'Verifiers', icon: 'V' },
  { path: '/transactions', label: 'Transactions', icon: 'T' },
  { path: '/audits', label: 'Audits', icon: 'A' },
  { path: '/methodologies', label: 'Methodologies', icon: 'M' },
  { path: '/issuances', label: 'Issuances', icon: 'I' },
  { path: '/retirements', label: 'Retirements', icon: 'R' },
  { path: '/beneficiaries', label: 'Beneficiaries', icon: 'B' },
  { path: '/scopes-emissions', label: 'Scope Emissions', icon: 'S' },
  { path: '/scoreboard', label: 'Scoreboard', icon: 'G' },
  { path: '/jurisdictional-baselines', label: 'Baselines', icon: 'J' },
  { path: '/satellite-imagery', label: 'Satellite Imagery', icon: 'X' },
  { path: '/smr-reports', label: 'SMR Reports', icon: 'M' },
  { path: '/claims', label: 'Claims', icon: 'L' },
  { path: '/biodiversity-cobenefits', label: 'Biodiversity', icon: 'D' },
  { path: '/finance-ledger', label: 'Finance Ledger', icon: 'F' },
  { path: '/corresponding-adjustments', label: 'Art.6 Adjustments', icon: '6' },
  { path: '/project-ratings', label: 'Project Ratings', icon: 'Q' },
  { path: '/retirement-certificate-pack', label: 'Certificate Pack', icon: 'R' },
  { path: '/issuance-chain', label: 'Issuance Chain', icon: '#' },
];

const aiLinks = [
  { path: '/ai/verify-project', label: 'Verify Project' },
  { path: '/ai/synthesize-mrv', label: 'Synthesize MRV' },
  { path: '/ai/detect-fraud', label: 'Detect Fraud' },
  { path: '/ai/analyze-pricing', label: 'Analyze Pricing' },
  { path: '/ai/map-methodology', label: 'Map Methodology' },
  { path: '/ai/draft-disclosure', label: 'Draft Disclosure' },
  { path: '/ai/leakage-modeler', label: 'Leakage Modeler' },
  { path: '/ai/satellite-mrv', label: 'Satellite MRV' },
  { path: '/ai/double-counting-detect', label: 'Double-Counting' },
  { path: '/ai/additionality-scorer', label: 'Additionality Scorer' },
  { path: '/ai/registry-arbitrage', label: 'Registry Arbitrage' },
  { path: '/ai/price-discovery', label: 'Price Discovery' },
  { path: '/ai/biodiversity-co-benefit', label: 'Biodiversity Co-Benefit' },
  { path: '/ai/climate-claim-validator', label: 'Claim Validator' },
  { path: '/ai/supply-cap-forecast', label: 'Supply Cap Forecast' },
  { path: '/ai/scope-3-attributor', label: 'Scope-3 Attributor' },
  { path: '/ai/mrv-document-validate', label: 'MRV Doc Validator' },
  { path: '/ai/narrative-evidence-reconcile', label: 'Narrative-Evidence' },
  { path: '/ai/aml-screen-transaction', label: 'AML Screening' },
  { path: '/ai/project-rating', label: 'Project Rating' },
];

const opsLinks = [
  { path: '/notifications', label: 'Notifications', icon: 'N' },
  { path: '/webhooks', label: 'Webhooks', icon: 'W' },
  { path: '/bulk-import', label: 'Bulk Import', icon: 'U' },
  { path: '/registry-interop', label: 'Registry Interop', icon: 'X' },
];

function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const user = currentUser();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    const tick = () => {
      getUnreadNotifications()
        .then((r) => { if (alive && r && typeof r.count === 'number') setUnread(r.count); })
        .catch(() => {});
    };
    tick();
    const t = setInterval(tick, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const linkClick = () => { if (onNavigate) onNavigate(); };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        CarbonLedger AI
        <small>Climate Finance Registry</small>
      </div>

      <NavLink to="/" end onClick={linkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <span className="icon">D</span> Dashboard
      </NavLink>

      <NavLink to="/notifications" onClick={linkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <span className="icon">N</span> Notifications
        {unread > 0 && <span className="bell-badge">{unread}</span>}
      </NavLink>

      <div className="sidebar-section">Registry</div>
      {crudLinks.map((l) => (
        <NavLink
          key={l.path}
          to={l.path}
          onClick={linkClick}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <span className="icon">{l.icon}</span> {l.label}
        </NavLink>
      ))}

      <div className="sidebar-section">AI Studio</div>
      {aiLinks.map((l) => (
        <NavLink
          key={l.path}
          to={l.path}
          onClick={linkClick}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <span className="icon">*</span> {l.label}
        </NavLink>
      ))}

      <div className="sidebar-section">Carbon Views</div>
      <NavLink to="/custom-views" onClick={linkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <span className="icon">*</span> Carbon Views
      </NavLink>

      <div className="sidebar-section">Ops</div>
      {opsLinks.filter((l) => l.path !== '/notifications').map((l) => (
        <NavLink
          key={l.path}
          to={l.path}
          onClick={linkClick}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <span className="icon">{l.icon}</span> {l.label}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-name">{user.name || user.email}</div>
            <div className="sidebar-user-email">{user.email} <span style={{ opacity: 0.6 }}>({user.role})</span></div>
          </div>
        )}
        <button className="sidebar-logout" onClick={handleLogout}>Sign out</button>
      </div>
    </aside>
  );
}

export default Sidebar;
