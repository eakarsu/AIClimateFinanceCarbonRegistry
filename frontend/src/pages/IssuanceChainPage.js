import React, { useEffect, useState } from 'react';
import { issuanceChainList, issuanceChainSeal, issuanceChainVerify } from '../services/api';

export default function IssuanceChainPage() {
  const [chain, setChain] = useState(null);
  const [verify, setVerify] = useState(null);
  const [sealResult, setSealResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const refresh = async () => {
    setLoading(true); setErr(null);
    try { setChain(await issuanceChainList()); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const seal = async () => {
    setLoading(true); setErr(null);
    try {
      setSealResult(await issuanceChainSeal());
      await refresh();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const doVerify = async () => {
    setLoading(true); setErr(null);
    try { setVerify(await issuanceChainVerify()); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const short = (h) => (h ? `${h.slice(0, 10)}…${h.slice(-6)}` : '');

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Issuance Hash-Chain</h2>
          <p>Append-only SHA-256 chain over the issuance ledger for tamper-evident audit.</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={refresh} disabled={loading}>Refresh</button>
          <button className="btn btn-ai" onClick={seal} disabled={loading}>Seal new issuances</button>
          <button className="btn" onClick={doVerify} disabled={loading}>Verify chain</button>
        </div>
      </div>

      {err && <div className="ai-error">{err}</div>}

      {chain && (
        <div className="ai-studio-card">
          <h3>Chain length: {chain.length} — head: <code>{short(chain.head)}</code></h3>
          {sealResult && (
            <p style={{ color: '#0a8a39' }}>Appended {sealResult.appended_count} new entries; head now <code>{short(sealResult.head)}</code></p>
          )}
          {verify && (
            <p style={{ color: verify.valid ? '#0a8a39' : '#c52f24' }}>
              Verify: {verify.valid ? 'VALID' : `INVALID (${verify.breaks.length} breaks)`}
            </p>
          )}
          <table className="data-table">
            <thead><tr>
              <th>#</th><th>Issuance</th><th>Project</th><th>Vintage</th><th>Tons</th><th>Prev</th><th>Hash</th>
            </tr></thead>
            <tbody>
              {(chain.chain || []).map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.issuance_id}</td>
                  <td>{row.project}</td>
                  <td>{row.vintage_year}</td>
                  <td>{row.tons_issued}</td>
                  <td><code>{short(row.prev_hash)}</code></td>
                  <td><code>{short(row.hash)}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
