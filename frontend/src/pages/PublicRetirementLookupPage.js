import React, { useState } from 'react';
import { publicRetirementLookup, publicRetirementSearch } from '../services/api';

export default function PublicRetirementLookupPage() {
  const [serial, setSerial] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [single, setSingle] = useState(null);
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    setLoading(true); setError(null); setSingle(null);
    try { setSingle(await publicRetirementLookup(serial.trim())); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  const search = async () => {
    setLoading(true); setError(null); setList(null);
    try { setList(await publicRetirementSearch(beneficiary.trim(), 50)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Public Retirement Lookup</h2>
          <p>Search by retirement serial or beneficiary name. No login required.</p>
        </div>
      </div>

      <div className="ai-studio-card">
        <h3>Lookup by Serial</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="RET-2024-00123" style={{ flex: 1 }} />
          <button className="btn btn-ai" onClick={lookup} disabled={loading || !serial.trim()}>Look up</button>
        </div>
        {single && (
          <pre className="ai-raw-pre" style={{ marginTop: 12 }}>{JSON.stringify(single, null, 2)}</pre>
        )}
      </div>

      <div className="ai-studio-card" style={{ marginTop: 16 }}>
        <h3>Search by Beneficiary</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} placeholder="Microsoft Corporation" style={{ flex: 1 }} />
          <button className="btn btn-ai" onClick={search} disabled={loading}>Search</button>
        </div>
        {list && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontWeight: 600 }}>{list.count} results</p>
            <table className="data-table">
              <thead><tr>
                <th>Retirement ID</th><th>Credits</th><th>Beneficiary</th><th>Claim</th><th>Retired</th>
              </tr></thead>
              <tbody>
                {(list.results || []).map((r) => (
                  <tr key={r.retirement_id}>
                    <td>{r.retirement_id}</td>
                    <td>{r.credits_amount}</td>
                    <td>{r.beneficiary}</td>
                    <td>{r.claim}</td>
                    <td>{r.retired_at ? new Date(r.retired_at).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && <div className="ai-error" style={{ marginTop: 12 }}>{error}</div>}
    </div>
  );
}
