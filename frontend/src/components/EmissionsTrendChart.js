import React, { useEffect, useState } from 'react';

// VIZ: emissions trend chart — baseline vs actual (and abatement gap).
function EmissionsTrendChart() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(24);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('cr_token');
    fetch(`/api/custom-views/emissions-trend?months=${months}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [months]);

  if (loading) return <div style={{ padding: 24 }}>Loading emissions trend...</div>;
  if (error)   return <div style={{ padding: 24, color: '#dc2626' }}>Error: {error}</div>;
  if (!data)   return null;

  const W = 760, H = 320, PAD_L = 60, PAD_B = 40, PAD_T = 16, PAD_R = 16;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const series = data.series || [];
  const maxV = Math.max(1, ...series.map((s) => Math.max(s.baseline, s.actual)));

  const x = (i) => PAD_L + (i / Math.max(1, series.length - 1)) * innerW;
  const y = (v) => PAD_T + (1 - v / maxV) * innerH;

  const baselinePath = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(s.baseline)}`).join(' ');
  const actualPath   = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(s.actual)}`).join(' ');
  const fillPath =
    series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(s.baseline)}`).join(' ') +
    ' ' +
    series.slice().reverse().map((s, j) => {
      const i = series.length - 1 - j;
      return `L ${x(i)} ${y(s.actual)}`;
    }).join(' ') + ' Z';

  return (
    <div className="ai-studio-card" data-testid="emissions-trend" style={{ maxWidth: 1000 }}>
      <h3>Emissions Trend — Baseline vs Actual</h3>
      <p className="desc">{data.summary}</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 12, color: '#475569' }}>Months:</label>
        {[12, 24, 36, 48].map((m) => (
          <button key={m} className={`btn ${m === months ? 'btn-ai' : 'btn-secondary'}`} onClick={() => setMonths(m)}>
            {m}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg width={W} height={H} role="img" aria-label="Baseline vs actual emissions chart" style={{ background: '#fafafa', borderRadius: 8 }}>
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const yy = PAD_T + innerH * (1 - t);
            return (
              <g key={i}>
                <line x1={PAD_L} x2={W - PAD_R} y1={yy} y2={yy} stroke="#e5e7eb" strokeDasharray="3 3" />
                <text x={PAD_L - 8} y={yy + 4} fontSize="10" textAnchor="end" fill="#64748b">
                  {Math.round((maxV * t) / 1e6 * 10) / 10}M
                </text>
              </g>
            );
          })}

          <path d={fillPath} fill="#10b981" opacity="0.18" />
          <path d={baselinePath} fill="none" stroke="#6b7280" strokeWidth="2.4" strokeDasharray="6 4" />
          <path d={actualPath}   fill="none" stroke="#059669" strokeWidth="2.6" />

          {series.map((s, i) => {
            if (i % Math.ceil(series.length / 8) !== 0) return null;
            return (
              <text key={i} x={x(i)} y={H - PAD_B + 14} fontSize="9" textAnchor="middle" fill="#475569">
                {s.month.slice(2)}
              </text>
            );
          })}

          <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + innerH} y2={PAD_T + innerH} stroke="#9ca3af" />
          <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={PAD_T + innerH} stroke="#9ca3af" />
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 18, fontSize: 12, marginTop: 8 }}>
        <Legend color="#6b7280" dashed label="Baseline (BAU)" />
        <Legend color="#059669" label="Actual (verified)" />
        <Legend color="#10b981" label="Abatement (shaded gap)" swatchOpacity={0.3} />
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
        <Stat label="Baseline tCO2e" value={(data.totals.baseline_tco2e / 1e6).toFixed(2) + ' Mt'} />
        <Stat label="Actual tCO2e"   value={(data.totals.actual_tco2e / 1e6).toFixed(2) + ' Mt'} />
        <Stat label="Reduced tCO2e"  value={(data.totals.reduced_tco2e / 1e6).toFixed(2) + ' Mt'} />
        <Stat label="% Reduction"    value={data.totals.pct_reduction + '%'} />
        <Stat label="Source"         value={data.source} />
      </div>
    </div>
  );
}

function Legend({ color, label, dashed, swatchOpacity }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        display: 'inline-block', width: 22, height: 4,
        background: color, borderRadius: 2, opacity: swatchOpacity ?? 1,
        borderTop: dashed ? `2px dashed ${color}` : undefined,
        backgroundColor: dashed ? 'transparent' : color,
      }} />
      <span>{label}</span>
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

export default EmissionsTrendChart;
