import React, { useState } from 'react';
import { bulkImport } from '../services/api';

const ENTITIES = [
  { value: 'projects', label: 'Projects', columns: 'project_id,name,type,country,hectares,status,description,developer' },
  { value: 'credits', label: 'Credits', columns: 'credit_id,project,vintage_year,tons_co2e,status,methodology,serial_number' },
  { value: 'transactions', label: 'Transactions', columns: 'transaction_id,from_holder,to_holder,credits_amount,price_per_ton_usd,status,notes' },
];

export default function BulkImportPage() {
  const [entity, setEntity] = useState('projects');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert('Choose a CSV file first');
    setLoading(true); setError(null); setResult(null);
    try { setResult(await bulkImport(entity, file)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const selected = ENTITIES.find((e) => e.value === entity);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Bulk CSV Import</h2>
          <p>Upload a CSV to seed projects, credits, or transactions in bulk.</p>
        </div>
      </div>

      <div className="ai-studio-card">
        <h3>Upload</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Entity</label>
            <select value={entity} onChange={(e) => setEntity(e.target.value)}>
              {ENTITIES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>CSV File</label>
            <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <div className="form-group full">
            <label>Expected header columns</label>
            <code style={{ background: '#f1f5f9', padding: 6, borderRadius: 4, fontSize: 12 }}>{selected.columns}</code>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={handleUpload} disabled={loading || !file}>
            {loading ? 'Uploading…' : 'Import'}
          </button>
        </div>

        {error && <div className="ai-error" style={{ marginTop: 14 }}>{error}</div>}

        {result && (
          <div className="ai-result" style={{ marginTop: 16 }}>
            <div className="ai-result-header">Import result</div>
            <p style={{ margin: '4px 0 8px' }}>
              <strong>{result.inserted}</strong> inserted, <strong>{result.failed}</strong> failed.
            </p>
            {result.errors && result.errors.length > 0 && (
              <details>
                <summary>{result.errors.length} errors</summary>
                <pre>{JSON.stringify(result.errors, null, 2)}</pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
