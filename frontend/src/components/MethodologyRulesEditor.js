import React, { useEffect, useState } from 'react';

// NON-VIZ: methodology / registry rules CRUD editor.
const EMPTY = {
  code: '', name: '', standard: 'VCS', category: 'avoided-deforestation',
  buffer_pool_pct: 20, leakage_pct: 5, additionality_test: 'investment',
  eligible_vintages: '2024-2034', requires_fpic: false, status: 'draft', notes: '',
};

const STANDARDS = ['VCS', 'Gold Standard', 'CDM', 'ACR', 'CAR', 'ART TREES', 'Puro.earth'];
const STATUSES = ['active', 'draft', 'deprecated'];
const CATEGORIES = [
  'avoided-deforestation', 'afforestation-reforestation', 'blue-carbon',
  'energy-efficiency-cookstoves', 'methane-capture', 'direct-air-capture',
  'improved-forest-management', 'renewables', 'other',
];

function MethodologyRulesEditor() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // {id?, ...form}
  const [busy, setBusy] = useState(false);

  const token = () => localStorage.getItem('cr_token');
  const authHeaders = (extra = {}) => {
    const t = token();
    return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
  };

  const load = () => {
    setLoading(true);
    fetch('/api/custom-views/methodology-rules', { headers: authHeaders() })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const url = editing.id
        ? `/api/custom-views/methodology-rules/${editing.id}`
        : '/api/custom-views/methodology-rules';
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(editing) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/custom-views/methodology-rules/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading rules...</div>;
  if (error && !data) return <div style={{ padding: 24, color: '#dc2626' }}>Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="ai-studio-card" data-testid="methodology-rules" style={{ maxWidth: 1100 }}>
      <h3>Registry / Methodology Rules Editor</h3>
      <p className="desc">{data.summary}</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {Object.entries(data.by_standard || {}).map(([k, v]) => (
            <span key={k} style={{
              fontSize: 11, padding: '4px 10px', background: '#eef2ff',
              color: '#3730a3', borderRadius: 999, fontWeight: 600,
            }}>{k}: {v}</span>
          ))}
        </div>
        <button className="btn btn-ai" onClick={() => setEditing({ ...EMPTY })} disabled={busy}>
          + New Rule
        </button>
      </div>

      {error && <div style={{ padding: 8, color: '#dc2626' }}>Error: {error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <Th>Code</Th><Th>Name</Th><Th>Standard</Th><Th>Category</Th>
              <Th>Buffer %</Th><Th>Leakage %</Th><Th>Addl. test</Th>
              <Th>Vintages</Th><Th>FPIC</Th><Th>Status</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.rules.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <Td><code>{r.code}</code></Td>
                <Td>{r.name}</Td>
                <Td>{r.standard}</Td>
                <Td>{r.category}</Td>
                <Td>{r.buffer_pool_pct}</Td>
                <Td>{r.leakage_pct}</Td>
                <Td>{r.additionality_test}</Td>
                <Td>{r.eligible_vintages}</Td>
                <Td>{r.requires_fpic ? 'yes' : 'no'}</Td>
                <Td>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                    background: r.status === 'active' ? '#dcfce7' : r.status === 'draft' ? '#fef3c7' : '#fee2e2',
                    color: r.status === 'active' ? '#166534' : r.status === 'draft' ? '#92400e' : '#991b1b',
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{r.status}</span>
                </Td>
                <Td>
                  <button className="btn btn-secondary" style={{ padding: '3px 10px', marginRight: 4 }} onClick={() => setEditing({ ...r })}>Edit</button>
                  <button className="btn btn-secondary" style={{ padding: '3px 10px' }} onClick={() => remove(r.id)} disabled={busy}>Delete</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div style={{
          marginTop: 16, padding: 16, border: '2px solid #6366f1', borderRadius: 10, background: '#eef2ff',
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#3730a3' }}>{editing.id ? `Edit Rule #${editing.id}` : 'New Rule'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <F label="Code"><input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></F>
            <F label="Name"><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></F>
            <F label="Standard">
              <select value={editing.standard} onChange={(e) => setEditing({ ...editing, standard: e.target.value })}>
                {STANDARDS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </F>
            <F label="Category">
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {CATEGORIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </F>
            <F label="Buffer Pool %"><input type="number" value={editing.buffer_pool_pct} onChange={(e) => setEditing({ ...editing, buffer_pool_pct: Number(e.target.value) })} /></F>
            <F label="Leakage %"><input type="number" value={editing.leakage_pct} onChange={(e) => setEditing({ ...editing, leakage_pct: Number(e.target.value) })} /></F>
            <F label="Additionality Test">
              <select value={editing.additionality_test} onChange={(e) => setEditing({ ...editing, additionality_test: e.target.value })}>
                {['investment', 'barrier', 'regulatory', 'common-practice'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </F>
            <F label="Eligible Vintages"><input value={editing.eligible_vintages} onChange={(e) => setEditing({ ...editing, eligible_vintages: e.target.value })} /></F>
            <F label="Requires FPIC">
              <select value={String(editing.requires_fpic)} onChange={(e) => setEditing({ ...editing, requires_fpic: e.target.value === 'true' })}>
                <option value="true">yes</option><option value="false">no</option>
              </select>
            </F>
            <F label="Status">
              <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </F>
            <F label="Notes" full>
              <textarea rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </F>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="btn btn-ai" onClick={save} disabled={busy || !editing.code || !editing.name}>
              {busy ? 'Saving...' : 'Save'}
            </button>
            <button className="btn btn-secondary" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return <th style={{ padding: '8px 10px', fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</th>;
}
function Td({ children }) {
  return <td style={{ padding: '6px 10px', verticalAlign: 'middle' }}>{children}</td>;
}
function F({ label, children, full }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gridColumn: full ? '1 / -1' : undefined }}>
      <span style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</span>
      {React.Children.map(children, (c) => React.cloneElement(c, {
        style: { padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, width: '100%', boxSizing: 'border-box', ...(c.props.style || {}) },
      }))}
    </label>
  );
}

export default MethodologyRulesEditor;
