import React, { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

export default function NotificationsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setRows(await getNotifications()); setError(null); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleRead = async (id) => { try { await markNotificationRead(id); load(); } catch (e) { alert(e.message); } };
  const handleReadAll = async () => { try { await markAllNotificationsRead(); load(); } catch (e) { alert(e.message); } };

  const colorFor = (type) => {
    if (type === 'fraud-alert') return '#ef4444';
    if (type === 'audit-finding') return '#f59e0b';
    if (type === 'retirement') return '#10b981';
    return '#6366f1';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Notifications</h2>
          <p>Fraud alerts, audit findings, and retirement events.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn" onClick={load}>Refresh</button>
          <button className="btn btn-primary" onClick={handleReadAll}>Mark all read</button>
        </div>
      </div>

      {error && <div className="ai-error" style={{ marginBottom: 12 }}>{error}</div>}
      {loading && <div className="ai-loading"><div className="spinner" /> Loading…</div>}

      <div style={{ display: 'grid', gap: 10 }}>
        {rows.map((n) => (
          <div key={n.id} style={{
            background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: 14,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            opacity: n.read ? 0.6 : 1,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: 'white', background: colorFor(n.type),
                  padding: '2px 8px', borderRadius: 12, textTransform: 'uppercase',
                }}>{n.type}</span>
                <strong style={{ fontSize: 14 }}>{n.title}</strong>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{n.body}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
            </div>
            {!n.read && <button className="btn" onClick={() => handleRead(n.id)}>Mark read</button>}
          </div>
        ))}
        {!loading && rows.length === 0 && <p style={{ color: 'var(--muted)' }}>No notifications yet.</p>}
      </div>
    </div>
  );
}
