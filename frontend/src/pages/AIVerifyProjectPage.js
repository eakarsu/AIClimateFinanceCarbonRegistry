import React from 'react';
import AIPage from '../components/AIPage';
import { aiVerifyProject } from '../services/api';

const fields = [
  { key: 'name', label: 'Project Name', placeholder: 'Katingan Mentaya Peatland Restoration', required: true },
  { key: 'type', label: 'Project Type', placeholder: 'avoided-deforestation', required: true },
  { key: 'country', label: 'Country', placeholder: 'Indonesia' },
  { key: 'hectares', label: 'Hectares', type: 'number' },
  { key: 'description', label: 'Description', type: 'textarea', fullWidth: true, placeholder: 'Peat-swamp forest conservation in Central Kalimantan…' },
];

export default function AIVerifyProjectPage() {
  return (
    <AIPage
      title="AI Verify Project"
      subtitle="Additionality, leakage, and permanence verification with structured scoring."
      fields={fields}
      buildPayload={(v) => v}
      runAI={(project) => aiVerifyProject(project)}
      examplePrompt="Describe a candidate carbon project. The AI returns an additionality / leakage / permanence verdict with conditions."
      feature="verify-project"
    />
  );
}
