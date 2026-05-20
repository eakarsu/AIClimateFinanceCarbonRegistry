import React from 'react';
import AIPage from '../components/AIPage';
import { aiDraftDisclosure } from '../services/api';

const fields = [
  { key: 'name', label: 'Holder Name', required: true, placeholder: 'Microsoft Corporation' },
  { key: 'type', label: 'Holder Type', placeholder: 'corporate' },
  { key: 'country', label: 'Country', placeholder: 'United States' },
  { key: 'credits_used_tco2e', label: 'Credits Used (tCO2e)', type: 'number', placeholder: '250000' },
  { key: 'targets', label: 'Stated Targets', type: 'textarea', fullWidth: true, placeholder: 'Carbon-negative by 2030; net-zero historical emissions by 2050…' },
];

export default function AIDraftDisclosurePage() {
  return (
    <AIPage
      title="AI Draft Disclosure"
      subtitle="TCFD-aligned climate disclosure drafts from holder registry activity."
      fields={fields}
      buildPayload={(v) => v}
      runAI={(holder) => aiDraftDisclosure(holder)}
      examplePrompt="Describe a holder. AI produces a TCFD-aligned governance/strategy/risk/metrics draft."
      feature="draft-disclosure"
    />
  );
}
