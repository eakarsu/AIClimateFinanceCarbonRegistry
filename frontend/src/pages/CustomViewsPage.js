import React, { useState } from 'react';
import EmissionsTrendChart from '../components/EmissionsTrendChart';
import ProjectRegionHeatmap from '../components/ProjectRegionHeatmap';
import CarbonCertificate from '../components/CarbonCertificate';
import MethodologyRulesEditor from '../components/MethodologyRulesEditor';

const TABS = [
  { key: 'emissions', label: 'Emissions Trend',         kind: 'viz'     },
  { key: 'heatmap',   label: 'Project-Region Heatmap',  kind: 'viz'     },
  { key: 'cert',      label: 'Carbon Certificate (PDF)',kind: 'non-viz' },
  { key: 'rules',     label: 'Methodology Rules',       kind: 'non-viz' },
];

function CustomViewsPage() {
  const [tab, setTab] = useState('emissions');

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Carbon Views</h2>
          <p>Custom carbon-registry views — 2 visualizations and 2 document/CRUD tools.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`btn ${tab === t.key ? 'btn-ai' : 'btn-secondary'}`}
            onClick={() => setTab(t.key)}
            style={{ position: 'relative' }}
          >
            {t.label}
            <span style={{
              marginLeft: 8, fontSize: 9, padding: '2px 6px', borderRadius: 10,
              background: t.kind === 'viz' ? '#dbeafe' : '#fef3c7',
              color: t.kind === 'viz' ? '#1e40af' : '#92400e',
              textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700,
            }}>{t.kind}</span>
          </button>
        ))}
      </div>

      {tab === 'emissions' && <EmissionsTrendChart />}
      {tab === 'heatmap'   && <ProjectRegionHeatmap />}
      {tab === 'cert'      && <CarbonCertificate />}
      {tab === 'rules'     && <MethodologyRulesEditor />}
    </div>
  );
}

export default CustomViewsPage;
