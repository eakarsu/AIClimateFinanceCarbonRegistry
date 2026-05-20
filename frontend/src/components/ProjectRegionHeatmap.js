import React, { useEffect, useState } from 'react';

// VIZ: project-by-region heatmap (CO2 reduced).
function ProjectRegionHeatmap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cr_token');
    fetch('/api/custom-views/project-region-heatmap', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading heatmap...</div>;
  if (error)   return <div style={{ padding: 24, color: '#dc2626' }}>Error: {error}</div>;
  if (!data)   return null;

  const { regions, types, matrix, max_value } = data;

  const colorFor = (v) => {
    const t = Math.min(1, Math.max(0, v / Math.max(1, max_value)));
    // green-yellow-red ramp keyed to magnitude of reductions
    const stops = [
      [240, 253, 244], // very light green
      [187, 247, 208],
      [134, 239, 172],
      [74,  222, 128],
      [34,  197, 94],
      [22,  163, 74],
      [15,  118, 110],
    ];
    const idx = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
    const f = (t * (stops.length - 1)) - idx;
    const a = stops[idx], b = stops[idx + 1];
    const mix = a.map((ch, i) => Math.round(ch + (b[i] - ch) * f));
    return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
  };

  const fmt = (v) => {
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(0) + 'k';
    return String(v);
  };

  return (
    <div className="ai-studio-card" data-testid="project-region-heatmap" style={{ maxWidth: 1100 }}>
      <h3>Project × Region Heatmap — CO2 Reduced</h3>
      <p className="desc">{data.summary}</p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 4, fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 10px', color: '#64748b', fontWeight: 600 }}>Region \\ Type</th>
              {types.map((t) => (
                <th key={t} style={{ textAlign: 'center', padding: '6px 4px', color: '#475569', fontWeight: 600, minWidth: 96 }}>
                  {t.replace(/-/g, ' ')}
                </th>
              ))}
              <th style={{ textAlign: 'center', padding: '6px 8px', color: '#0f172a' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((r) => {
              const rowTotal = types.reduce((s, t) => s + matrix[r][t], 0);
              return (
                <tr key={r}>
                  <td style={{ padding: '4px 10px', fontWeight: 600, color: '#0f172a' }}>{r}</td>
                  {types.map((t) => {
                    const v = matrix[r][t];
                    return (
                      <td
                        key={t}
                        title={`${r} • ${t}: ${v.toLocaleString()} tCO2e reduced`}
                        style={{
                          background: colorFor(v),
                          color: v > max_value * 0.55 ? 'white' : '#0f172a',
                          padding: '10px 6px',
                          textAlign: 'center',
                          borderRadius: 6,
                          fontWeight: 600,
                          fontSize: 11,
                          minWidth: 76,
                        }}
                      >
                        {fmt(v)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{fmt(rowTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, fontSize: 11, color: '#475569' }}>
        <span>Less CO2 reduced</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {[0, 0.15, 0.3, 0.5, 0.7, 0.85, 1].map((t, i) => (
            <span key={i} style={{ width: 22, height: 12, background: colorFor(t * max_value), borderRadius: 2 }} />
          ))}
        </div>
        <span>More CO2 reduced</span>
      </div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
        <Stat label="Regions"     value={regions.length} />
        <Stat label="Project Types" value={types.length} />
        <Stat label="Grand Total" value={(data.grand_total_tco2e / 1e6).toFixed(2) + ' MtCO2e'} />
        <Stat label="Source"      value={data.source} />
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

export default ProjectRegionHeatmap;
