import React from 'react';
import AIPage from '../components/AIPage';
import { aiNarrativeEvidenceReconcile } from '../services/api';

// The samples provide `narrative` and `evidence` as full JSON objects.
// Fields render those as JSON-blob textareas so Sample-Fill works directly.
const fields = [
  { key: 'narrative', label: 'Narrative (JSON)', type: 'textarea', fullWidth: true, required: true,
    placeholder: '{"project": "Rimba Raya", "claim": "Protected 64,977 ha; zero deforestation 2020-2023..."}' },
  { key: 'evidence', label: 'Evidence (JSON)', type: 'textarea', fullWidth: true, required: true,
    placeholder: '{"satellite_alerts_2020_2023": 18, "canopy_loss_ha": 142, ...}' },
];

function asObject(v) {
  if (v == null) return {};
  if (typeof v === 'object') return v;
  const s = String(v).trim();
  if (!s) return {};
  try { return JSON.parse(s); } catch (_) { return { raw: s }; }
}

export default function AINarrativeEvidenceReconcilePage() {
  return (
    <AIPage
      title="AI Narrative-vs-Evidence Reconcile"
      subtitle="Cross-check project narrative against attachments, satellite signals, ledger entries, and ground-truth data."
      fields={fields}
      buildPayload={(v) => ({
        narrative: asObject(v.narrative),
        evidence: asObject(v.evidence),
      })}
      runAI={({ narrative, evidence }) => aiNarrativeEvidenceReconcile(narrative, evidence)}
      examplePrompt="AI reconciles narrative claims against documented evidence (satellite/attachments/ledger)."
      feature="narrative-evidence-reconcile"
    />
  );
}
