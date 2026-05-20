import React, { useEffect, useState } from 'react';

// Simple SVG stacked-area / bar chart (no external chart deps).
function IssuanceTrendChart() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cr_token');
    fetch('/api/custom-views/issuance-trend?months=24', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading issuance trend…</div>;
  if (error)   return <div style={{ padding: 24, color: '#dc2626' }}>Error: {error}</div>;
  if (!data)   return null;

  const W = 720, H = 280, PAD_L = 50, PAD_B = 36, PAD_T = 14, PAD_R = 14;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const series = data.series || [];
  const maxTotal = Math.max(1, ...series.map((s) => s.total));
  const colors = ['#10b981', '#22c55e', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444'];
  const types = data.project_types || [];

  const barW = innerW / series.length;

  return (
    <div className="ai-studio-card" style={{ maxWidth: 980 }}>
      <h3>Carbon Credit Issuance Trend</h3>
      <p className="desc">{data.summary}</p>

      <div style={{ overflowX: 'auto' }}>
        <svg width={W} height={H} role="img" aria-label="Issuance trend chart" style={{ background: '#fafafa', borderRadius: 8 }}>
          {/* y-axis grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = PAD_T + innerH * (1 - t);
            return (
              <g key={i}>
                <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="3 3" />
                <text x={PAD_L - 8} y={y + 4} fontSize="10" textAnchor="end" fill="#6b7280">
                  {Math.round((maxTotal * t) / 1000).toLocaleString()}k
                </text>
              </g>
            );
          })}

          {/* stacked bars per month */}
          {series.map((row, i) => {
            const x = PAD_L + i * barW + 2;
            let yCursor = PAD_T + innerH;
            return (
              <g key={i}>
                {types.map((t, ti) => {
                  const v = row[t] || 0;
                  const h = (v / maxTotal) * innerH;
                  const y = yCursor - h;
                  yCursor = y;
                  return <rect key={ti} x={x} y={y} width={Math.max(1, barW - 4)} height={h} fill={colors[ti % colors.length]} opacity={0.92}>
                    <title>{`${row.month} • ${t}: ${v.toLocaleString()} tCO2e`}</title>
                  </rect>;
                })}
                {(i % 3 === 0) && (
                  <text x={x + barW / 2} y={H - PAD_B + 14} fontSize="9" textAnchor="middle" fill="#4b5563">
                    {row.month.slice(2)}
                  </text>
                )}
              </g>
            );
          })}

          <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + innerH} y2={PAD_T + innerH} stroke="#9ca3af" />
          <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={PAD_T + innerH} stroke="#9ca3af" />
        </svg>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
        {types.map((t, i) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: colors[i % colors.length], borderRadius: 2 }} />
            <span>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
        <Stat label="Months" value={data.months} />
        <Stat label="Grand total tCO2e" value={Number(data.grand_total_tco2e || 0).toLocaleString()} />
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

export default IssuanceTrendChart;
