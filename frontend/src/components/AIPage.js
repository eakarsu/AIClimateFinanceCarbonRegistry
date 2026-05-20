import React, { useEffect, useState } from 'react';
import { aiHistory, aiSamples } from '../services/api';
import AIResultDisplay from './AIResultDisplay';

/**
 * Reusable AI page wrapper.
 * Props:
 *   title, subtitle, fields: [{ key, label, type?: 'text'|'textarea'|'number', placeholder?, required? }]
 *   buildPayload: (formValues) => any  — convert form values into the AI call argument(s)
 *   runAI: (payload) => Promise<result>
 *   examplePrompt?: string — sample text shown to users
 *   feature?: string — feature name for ai_results history lookup
 */
function AIPage({ title, subtitle, fields, buildPayload, runAI, examplePrompt, feature }) {
  const [values, setValues] = useState(() =>
    fields.reduce((acc, f) => ({ ...acc, [f.key]: f.default ?? '' }), {})
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // History modal state
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);

  // Sample scenarios — fetched on mount, rendered as "Sample Fill" buttons above the form.
  const [samples, setSamples] = useState([]);
  useEffect(() => {
    if (!feature) return;
    let cancelled = false;
    aiSamples(feature)
      .then((r) => { if (!cancelled) setSamples(Array.isArray(r && r.samples) ? r.samples : []); })
      .catch(() => { /* non-fatal — buttons just won't render */ });
    return () => { cancelled = true; };
  }, [feature]);

  const fillSample = (sample) => {
    if (!sample || !sample.values) return;
    setValues((p) => {
      const next = { ...p };
      // Only set keys that the page actually declares — keeps form state clean.
      for (const f of fields) {
        if (Object.prototype.hasOwnProperty.call(sample.values, f.key)) {
          next[f.key] = sample.values[f.key];
        }
      }
      return next;
    });
    setResult(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setValues((p) => ({ ...p, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }));
  };

  const handleRun = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const payload = buildPayload(values);
      const r = await runAI(payload);
      setResult(r);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const openHistory = async () => {
    setShowHistory(true);
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryRows([]);
    try {
      const rows = await aiHistory(feature);
      setHistoryRows(rows);
    } catch (e) {
      setHistoryError(e.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="page-header-actions">
          <button className="btn" onClick={openHistory}>🕘 History</button>
        </div>
      </div>

      <div className="ai-studio-card">
        <h3>Inputs</h3>
        <p className="desc">{examplePrompt || 'Provide inputs below and press Run to invoke the AI model via OpenRouter.'}</p>

        {samples.length > 0 && (
          <div
            className="ai-samples-strip"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '6px 0 14px', alignItems: 'center' }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted, #64748b)', marginRight: 4 }}>
              Sample Fill:
            </span>
            {samples.map((s, i) => (
              <button
                key={i}
                type="button"
                className="btn btn-secondary"
                onClick={() => fillSample(s)}
                title={`Fill form with: ${s.label}`}
                style={{ fontSize: 12, padding: '6px 10px' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="form-grid">
          {fields.map((f) => (
            <div key={f.key} className={`form-group ${f.fullWidth ? 'full' : ''}`}>
              <label>{f.label}{f.required ? ' *' : ''}</label>
              {f.type === 'textarea' ? (
                <textarea
                  name={f.key}
                  value={values[f.key]}
                  placeholder={f.placeholder}
                  onChange={handleChange}
                  style={{ minHeight: 120 }}
                />
              ) : (
                <input
                  name={f.key}
                  type={f.type || 'text'}
                  value={values[f.key]}
                  placeholder={f.placeholder}
                  onChange={handleChange}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <button className="btn btn-ai" onClick={handleRun} disabled={loading}>
            {loading ? 'Running…' : '✨ Run AI'}
          </button>
        </div>

        {(loading || error || result) && (
          <div style={{ marginTop: 16 }}>
            <AIResultDisplay result={result} loading={loading} error={error} />
          </div>
        )}
      </div>

      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 880 }}>
            <div className="modal-header">
              <h3>AI History {feature ? `— ${feature}` : ''}</h3>
              <button className="modal-close" onClick={() => setShowHistory(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {historyLoading && <div className="ai-loading"><div className="spinner" /> Loading…</div>}
              {historyError && <div className="ai-error">{historyError}</div>}
              {!historyLoading && !historyError && historyRows.length === 0 && (
                <p style={{ color: 'var(--muted)' }}>No prior runs yet.</p>
              )}
              {historyRows.map((row) => (
                <div key={row.id} className="history-row">
                  <div className="history-row-meta">
                    <span className="history-row-feature">{row.feature}</span>
                    <span className="history-row-time">{new Date(row.created_at).toLocaleString()}</span>
                    {row.model && <span className="history-row-model">{row.model}</span>}
                  </div>
                  {row.input && Object.keys(row.input || {}).length > 0 && (
                    <details>
                      <summary>Input</summary>
                      <pre className="ai-raw-pre">{JSON.stringify(row.input, null, 2)}</pre>
                    </details>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <AIResultDisplay result={row.output} loading={false} error={null} />
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowHistory(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIPage;
