import React, { useState } from 'react';
import { draftRetirementCertificatePack } from '../services/api';

export default function RetirementCertificatePackPage() {
  const [payload, setPayload] = useState('{"beneficiary":"Acme Foods","project":"Mangrove Restoration 42","tonnes":1200,"vintage":2022}');
  const [result, setResult] = useState(null);
  const run = async () => setResult(await draftRetirementCertificatePack(JSON.parse(payload || '{}')));
  return (
    <div className="page">
      <div className="page-header"><h1>Retirement Certificate Pack</h1><button className="btn primary" onClick={run}>Draft Pack</button></div>
      <textarea rows={8} value={payload} onChange={(e) => setPayload(e.target.value)} />
      {result && <pre className="card">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
