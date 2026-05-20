import React, { useEffect, useState } from 'react';
import { listWebhooks, createWebhook, deleteWebhook, webhookDeliveries, testWebhook } from '../services/api';

export default function WebhooksPage() {
  const [hooks, setHooks] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState({ issuance: true, transfer: true, retirement: true });
  const [error, setError] = useState(null);
  const [testEvent, setTestEvent] = useState('retirement');

  const load = async () => {
    try {
      const [h, d] = await Promise.all([listWebhooks(), webhookDeliveries()]);
      setHooks(h); setDeliveries(d); setError(null);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!url) return alert('URL required');
    const events_list = Object.keys(events).filter((k) => events[k]);
    if (events_list.length === 0) return alert('Select at least one event');
    try { await createWebhook({ url, events: events_list }); setUrl(''); load(); }
    catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete webhook?')) return;
    try { await deleteWebhook(id); load(); } catch (e) { alert(e.message); }
  };

  const handleTest = async () => {
    try { await testWebhook(testEvent, { test: true, ts: new Date().toISOString() }); load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Webhooks</h2>
          <p>Fire on issuance / transfer / retirement with HMAC-SHA256 signature.</p>
        </div>
      </div>
      {error && <div className="ai-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="ai-studio-card" style={{ marginBottom: 16 }}>
        <h3>Subscribe a webhook</h3>
        <div className="form-grid">
          <div className="form-group full">
            <label>URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/hooks/carbon" />
          </div>
          <div className="form-group full">
            <label>Events</label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {['issuance', 'transfer', 'retirement'].map((ev) => (
                <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={events[ev]}
                    onChange={(e) => setEvents((p) => ({ ...p, [ev]: e.target.checked }))}
                  /> {ev}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={handleCreate}>Create</button>
        </div>
      </div>

      <div className="ai-studio-card" style={{ marginBottom: 16 }}>
        <h3>Test fire</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={testEvent} onChange={(e) => setTestEvent(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <option value="issuance">issuance</option>
            <option value="transfer">transfer</option>
            <option value="retirement">retirement</option>
          </select>
          <button className="btn btn-ai" onClick={handleTest}>Fire</button>
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>Subscribers ({hooks.length})</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>ID</th><th>URL</th><th>Events</th><th>Active</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {hooks.map((h) => (
              <tr key={h.id}>
                <td>{h.id}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{h.url}</td>
                <td>{Array.isArray(h.events) ? h.events.join(', ') : ''}</td>
                <td>{h.active ? 'yes' : 'no'}</td>
                <td>{new Date(h.created_at).toLocaleString()}</td>
                <td><button className="btn btn-danger" onClick={() => handleDelete(h.id)}>Delete</button></td>
              </tr>
            ))}
            {hooks.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>No webhooks registered.</td></tr>}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 24 }}>Recent deliveries ({deliveries.length})</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>When</th><th>Event</th><th>URL</th><th>Status</th><th>Signature</th></tr></thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id}>
                <td>{new Date(d.delivered_at).toLocaleString()}</td>
                <td>{d.event}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{d.url}</td>
                <td><span className={`status-badge status-${d.response_status >= 200 && d.response_status < 300 ? 'compliant' : 'failed'}`}>{d.response_status}</span></td>
                <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{(d.signature || '').slice(0, 28)}…</td>
              </tr>
            ))}
            {deliveries.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>No deliveries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
