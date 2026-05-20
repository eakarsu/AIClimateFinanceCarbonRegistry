import React, { useState } from 'react';

function VerificationReport() {
  const [projectName, setProjectName] = useState('Katingan Mentaya Peatland Restoration');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true); setError(null); setReport(null);
    try {
      const token = localStorage.getItem('cr_token');
      const qs = projectName ? `?project=${encodeURIComponent(projectName)}` : '';
      const r = await fetch(`/api/custom-views/verification-report${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setReport(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const downloadReport = () => {
    if (!report) return;
    const text = formatReportText(report);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${report.report_id || 'verification-report'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ai-studio-card" style={{ maxWidth: 980 }}>
      <h3>Verification Report Generator</h3>
      <p className="desc">
        Generate an independent verification report (VCS / ICVCM-aligned) for any registry project.
        Output is a structured report you can download as a text "PDF-equivalent".
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 280px' }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Project name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}
          />
        </div>
        <button className="btn btn-ai" onClick={run} disabled={loading}>
          {loading ? 'Generating…' : 'Generate Report'}
        </button>
        {report && (
          <button className="btn btn-secondary" onClick={downloadReport}>
            Download
          </button>
        )}
      </div>

      {error && <div style={{ marginTop: 12, color: '#dc2626' }}>Error: {error}</div>}

      {report && (
        <div style={{ marginTop: 18, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 16, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
          {formatReportText(report)}
        </div>
      )}
    </div>
  );
}

function formatReportText(r) {
  const f = (r.findings || []).map((x) => `  • ${x.area.padEnd(28)} [${x.verdict}] — ${x.notes}`).join('\n');
  const c = (r.conditions || []).map((x, i) => `  ${i + 1}. ${x}`).join('\n');
  const vq = r.verified_quantities || {};
  return (
`═══════════════════════════════════════════════════════════════════════════
              INDEPENDENT VERIFICATION REPORT
═══════════════════════════════════════════════════════════════════════════
Report ID:       ${r.report_id}
Generated:       ${r.generated_at}
Verifier:        ${r.verifier}
Standard:        ${r.standard}

PROJECT
  ID:            ${r.project?.project_id || 'n/a'}
  Name:          ${r.project?.name || ''}
  Type:          ${r.project?.type || ''}
  Country:       ${r.project?.country || ''}
  Hectares:      ${(r.project?.hectares || 0).toLocaleString()}

EXECUTIVE SUMMARY
${wrap(r.executive_summary || '', 75, '  ')}

FINDINGS
${f}

VERIFIED QUANTITIES
  Annual reductions:   ${(vq.annual_reductions_tco2e || 0).toLocaleString()} tCO2e
  Uncertainty:         ±${vq.uncertainty_pct || 0}%
  Buffer pool:         ${(vq.buffer_pool_tco2e || 0).toLocaleString()} tCO2e
  Net issuance:        ${(vq.net_issuance_tco2e || 0).toLocaleString()} tCO2e

CONDITIONS
${c}

SIGN-OFF
  Lead verifier:       ${r.sign_off?.lead_verifier || ''}
  Peer reviewer:       ${r.sign_off?.peer_reviewer || ''}
  Issued on:           ${r.sign_off?.issued_on || ''}

═══════════════════════════════════════════════════════════════════════════
${r.summary || ''}
═══════════════════════════════════════════════════════════════════════════
`);
}

function wrap(s, width, indent) {
  const words = String(s).split(/\s+/);
  const lines = []; let line = indent;
  for (const w of words) {
    if ((line + ' ' + w).length > width) { lines.push(line); line = indent + w; }
    else line = (line === indent) ? line + w : line + ' ' + w;
  }
  if (line.trim()) lines.push(line);
  return lines.join('\n');
}

export default VerificationReport;
