import React, { useState } from 'react';

// NON-VIZ: carbon credit certificate generator — preview + PDF download.
function CarbonCertificate() {
  const [form, setForm] = useState({
    beneficiary: 'Microsoft Corporation',
    tons: 12500,
    vintage: new Date().getFullYear() - 1,
    project: 'Katingan Mentaya Peatland Restoration',
    methodology: 'VCS VM0007',
    claim: 'Scope 1+2 residual emissions',
  });
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const buildQS = (extra = {}) => {
    const all = { ...form, ...extra };
    return Object.entries(all)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('cr_token');
      const r = await fetch(`/api/custom-views/carbon-certificate?${buildQS()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const downloadPdf = () => {
    const token = localStorage.getItem('cr_token');
    const url = `/api/custom-views/carbon-certificate?${buildQS({ format: 'pdf' })}`;
    // Fetch with Authorization then open as blob (token can't go in href).
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); })
      .then((blob) => {
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = `carbon-certificate-${form.vintage}-${form.tons}.pdf`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
      })
      .catch((e) => setError(e.message));
  };

  return (
    <div className="ai-studio-card" data-testid="carbon-certificate" style={{ maxWidth: 900 }}>
      <h3>Carbon Credit Certificate (PDF)</h3>
      <p className="desc">
        Generate a retirement certificate for verified carbon credits. Preview as JSON or download as PDF.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <Field label="Beneficiary">
          <input value={form.beneficiary} onChange={(e) => set('beneficiary', e.target.value)} />
        </Field>
        <Field label="Tons CO2e">
          <input type="number" value={form.tons} onChange={(e) => set('tons', Number(e.target.value))} />
        </Field>
        <Field label="Vintage Year">
          <input type="number" value={form.vintage} onChange={(e) => set('vintage', Number(e.target.value))} />
        </Field>
        <Field label="Methodology">
          <input value={form.methodology} onChange={(e) => set('methodology', e.target.value)} />
        </Field>
        <Field label="Project" full>
          <input value={form.project} onChange={(e) => set('project', e.target.value)} />
        </Field>
        <Field label="Claim Purpose" full>
          <input value={form.claim} onChange={(e) => set('claim', e.target.value)} />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className="btn btn-ai" onClick={generate} disabled={loading}>
          {loading ? 'Generating...' : 'Preview Certificate'}
        </button>
        <button className="btn btn-secondary" onClick={downloadPdf} disabled={loading}>
          Download PDF
        </button>
      </div>

      {error && <div style={{ padding: 8, color: '#dc2626' }}>Error: {error}</div>}

      {data && (
        <div style={{
          border: '2px solid #059669', borderRadius: 10, padding: 22, background: '#f0fdf4',
          fontFamily: 'Georgia, serif',
        }}>
          <div style={{ textAlign: 'center', borderBottom: '1px solid #86efac', paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#065f46' }}>CARBON CREDIT RETIREMENT</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#064e3b' }}>{data.registry}</div>
            <div style={{ fontSize: 12, color: '#065f46' }}>{data.standard}</div>
          </div>
          <Row k="Certificate ID" v={data.certificate_id} />
          <Row k="Issued"         v={new Date(data.issued_at).toLocaleString()} />
          <Row k="Beneficiary"    v={data.beneficiary} />
          <Row k="Project"        v={`${data.project.name} (${data.project.country})`} />
          <Row k="Methodology"    v={data.project.methodology} />
          <Row k="Retired"        v={`${data.retirement.tons_co2e.toLocaleString()} tCO2e`} />
          <Row k="Vintage"        v={data.retirement.vintage_year} />
          <Row k="Serial Range"   v={data.retirement.serial_number_range} />
          <Row k="Claim Purpose"  v={data.retirement.claim_purpose} />
          <Row k="Retired On"     v={data.retirement.retired_on} />
          <div style={{
            marginTop: 14, padding: 12, background: 'white', borderLeft: '3px solid #059669',
            borderRadius: 4, fontSize: 13, lineHeight: 1.55, color: '#0f172a', fontFamily: 'system-ui',
          }}>
            {data.attestation}
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: '#065f46', textAlign: 'right' }}>
            {data.issuer.name} — {data.issuer.title}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gridColumn: full ? '1 / -1' : undefined }}>
      <span style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</span>
      <span style={{ display: 'block' }}>
        {React.Children.map(children, (c) =>
          React.cloneElement(c, {
            style: {
              padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6,
              fontSize: 13, width: '100%', boxSizing: 'border-box', ...(c.props.style || {}),
            },
          })
        )}
      </span>
    </label>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: '1px dashed #bbf7d0' }}>
      <span style={{ color: '#065f46', fontWeight: 600 }}>{k}</span>
      <span style={{ color: '#0f172a' }}>{v}</span>
    </div>
  );
}

export default CarbonCertificate;
