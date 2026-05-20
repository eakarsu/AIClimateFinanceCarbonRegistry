import React, { useEffect, useState } from 'react';

// World-map-ish equirectangular projection of project lat/lng onto a simple SVG.
function ProjectMap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('cr_token');
    fetch('/api/custom-views/project-map', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading project map…</div>;
  if (error)   return <div style={{ padding: 24, color: '#dc2626' }}>Error: {error}</div>;
  if (!data)   return null;

  const W = 720, H = 360;
  // lat:  +90 → y=0;  -90 → y=H
  // lng: -180 → x=0; +180 → x=W
  const project = (lat, lng) => ({
    x: ((lng + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  });

  const colorByType = {
    'avoided-deforestation':       '#16a34a',
    'afforestation-reforestation': '#22c55e',
    'blue-carbon':                 '#0ea5e9',
    'energy-efficiency-cookstoves':'#f59e0b',
    'methane-capture':             '#ef4444',
    'direct-air-capture':          '#8b5cf6',
    'improved-forest-management':  '#14b8a6',
    'renewables':                  '#a855f7',
  };

  return (
    <div className="ai-studio-card" style={{ maxWidth: 980 }}>
      <h3>Project Geographic Map</h3>
      <p className="desc">{data.summary}</p>

      <div style={{ position: 'relative', overflowX: 'auto' }}>
        <svg width={W} height={H} role="img" aria-label="Project map" style={{ background: '#eff6ff', borderRadius: 8, border: '1px solid #dbeafe' }}>
          {/* Equator + prime meridian as faint guides */}
          <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="#bfdbfe" strokeDasharray="4 4" />
          <line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke="#bfdbfe" strokeDasharray="4 4" />
          {[-60, -30, 30, 60].map((lat) => (
            <line key={lat} x1={0} x2={W} y1={((90 - lat) / 180) * H} y2={((90 - lat) / 180) * H} stroke="#dbeafe" />
          ))}

          {(data.features || []).map((f) => {
            const { x, y } = project(f.lat, f.lng);
            const r = Math.max(5, Math.min(14, 5 + Math.log10(1 + (f.hectares || 1)) * 1.6));
            const color = colorByType[f.type] || '#6b7280';
            return (
              <g key={f.id}
                 onMouseEnter={() => setHover(f)}
                 onMouseLeave={() => setHover(null)}
                 style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r={r} fill={color} opacity={0.78} stroke="#fff" strokeWidth={1.5} />
                <title>{`${f.name} — ${f.country} — ${f.hectares.toLocaleString()} ha`}</title>
              </g>
            );
          })}
        </svg>

        {hover && (
          <div style={{
            position: 'absolute', top: 8, right: 8, background: 'white',
            border: '1px solid #e5e7eb', borderRadius: 8, padding: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)', maxWidth: 260, fontSize: 12
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{hover.name}</div>
            <div>Type: {hover.type}</div>
            <div>Country: {hover.country} ({hover.region})</div>
            <div>Hectares: {hover.hectares.toLocaleString()}</div>
            <div>Status: {hover.status}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
        {Object.entries(colorByType).map(([t, c]) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: c, borderRadius: 6 }} />
            <span>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
        <Stat label="Projects" value={data.count} />
        <Stat label="Regions" value={Object.keys(data.by_region || {}).length} />
        <Stat label="Source" value={data.source} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{value}</div>
    </div>
  );
}

export default ProjectMap;
