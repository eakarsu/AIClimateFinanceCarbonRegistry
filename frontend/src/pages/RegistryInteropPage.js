import React, { useEffect, useState } from 'react';
import { registryInteropStatus, registryInteropSync } from '../services/api';

const REGISTRIES = ['verra', 'gold-standard', 'acr', 'car'];

export default function RegistryInteropPage() {
  const [status, setStatus] = useState(null);
  const [syncResults, setSyncResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    registryInteropStatus().then(setStatus).catch((e) => setErr(e.message));
  }, []);

  const trySync = async (r) => {
    setLoading(true);
    try {
      const res = await registryInteropSync(r);
      setSyncResults((p) => ({ ...p, [r]: res }));
    } catch (e) {
      // 503 stub returns an error in body; capture it.
      setSyncResults((p) => ({ ...p, [r]: { error: e.message } }));
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Registry Interop</h2>
          <p>Verra / Gold Standard / ACR / CAR adapters. Requires registry-specific API credentials — currently NEEDS-CREDS (503).</p>
        </div>
      </div>

      <div className="ai-studio-card">
        <h3>Adapter Status</h3>
        {err && <div className="ai-error">{err}</div>}
        {status && (
          <table className="data-table">
            <thead><tr><th>Registry</th><th>Configured</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {status.adapters.map((a) => (
                <tr key={a.registry}>
                  <td>{a.registry}</td>
                  <td>{a.configured ? 'yes' : 'no'}</td>
                  <td>{a.status}</td>
                  <td>
                    <button className="btn btn-secondary" disabled={loading} onClick={() => trySync(a.registry)}>
                      Probe sync
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {REGISTRIES.map((r) => syncResults[r] && (
          <div key={r} style={{ marginTop: 12 }}>
            <strong>{r}:</strong>
            <pre className="ai-raw-pre">{JSON.stringify(syncResults[r], null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
