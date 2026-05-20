import React, { useState } from 'react';

function RetirementCertificate() {
  const [form, setForm] = useState({
    beneficiary: 'Microsoft Corporation',
    project: 'Katingan Mentaya Peatland Restoration',
    tons: 12500,
    vintage: 2024,
    claim: 'Scope 1+2 residual emissions',
  });
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const generate = async () => {
    setLoading(true); setError(null); setCert(null);
    try {
      const token = localStorage.getItem('cr_token');
      const qs = new URLSearchParams({
        beneficiary: form.beneficiary,
        project: form.project,
        tons: String(form.tons),
        vintage: String(form.vintage),
        claim: form.claim,
      }).toString();
      const r = await fetch(`/api/custom-views/retirement-certificate?${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setCert(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const download = () => {
    if (!cert) return;
    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${cert.certificate_id || 'retirement-cert'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ai-studio-card" style={{ maxWidth: 980 }}>
      <h3>Retirement Certificate Generator</h3>
      <p className="desc">
        Issue a verifiable retirement certificate when carbon credits are permanently removed from circulation.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <Field label="Beneficiary"  value={form.beneficiary} onChange={(v) => update('beneficiary', v)} />
        <Field label="Project"      value={form.project}     onChange={(v) => update('project', v)} />
        <Field label="Tons (tCO2e)" value={form.tons}        onChange={(v) => update('tons', Number(v) || 0)} type="number" />
        <Field label="Vintage year" value={form.vintage}     onChange={(v) => update('vintage', Number(v) || 0)} type="number" />
        <Field label="Claim purpose" value={form.claim}      onChange={(v) => update('claim', v)} />
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        <button className="btn btn-ai" onClick={generate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate Certificate'}
        </button>
        {cert && <button className="btn btn-secondary" onClick={download}>Download JSON</button>}
      </div>

      {error && <div style={{ marginTop: 12, color: '#dc2626' }}>Error: {error}</div>}

      {cert && (
        <div style={{ marginTop: 20, position: 'relative', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '2px solid #047857', borderRadius: 12, padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#065f46', textTransform: 'uppercase' }}>Certificate of Retirement</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#064e3b', marginTop: 4 }}>{cert.registry}</div>
            <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>{cert.standard}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
            <Cell k="Certificate ID"      v={cert.certificate_id} mono />
            <Cell k="Issued at"           v={cert.issued_at?.slice(0, 19).replace('T', ' ')} />
            <Cell k="Beneficiary"         v={cert.beneficiary} />
            <Cell k="Project"             v={cert.project?.name} />
            <Cell k="Methodology"         v={cert.project?.methodology} />
            <Cell k="Country"             v={cert.project?.country} />
            <Cell k="Tons retired (tCO2e)" v={(cert.retirement?.tons_co2e || 0).toLocaleString()} />
            <Cell k="Vintage"             v={cert.retirement?.vintage_year} />
            <Cell k="Serial range"        v={cert.retirement?.serial_number_range} mono />
            <Cell k="Claim purpose"       v={cert.retirement?.claim_purpose} />
          </div>

          <div style={{ background: 'white', border: '1px solid #a7f3d0', borderRadius: 8, padding: 14, fontSize: 13, lineHeight: 1.55, color: '#064e3b' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>ATTESTATION</div>
            {cert.attestation}
          </div>

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 12, color: '#065f46' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{cert.issuer_signature?.name}</div>
              <div>{cert.issuer_signature?.title}</div>
              <div>{cert.issuer_signature?.signed_on?.slice(0, 10)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>Verification:</div>
              <div style={{ wordBreak: 'break-all', maxWidth: 280 }}>{cert.verification_url}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type={type || 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}
      />
    </div>
  );
}

function Cell({ k, v, mono }) {
  return (
    <div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#047857' }}>{k}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#064e3b', wordBreak: 'break-word', fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : 'inherit' }}>{v}</div>
    </div>
  );
}

export default RetirementCertificate;
