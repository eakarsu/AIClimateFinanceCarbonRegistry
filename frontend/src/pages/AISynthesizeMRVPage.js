import React from 'react';
import AIPage from '../components/AIPage';
import { aiSynthesizeMRV } from '../services/api';

const fields = [
  { key: 'name', label: 'Project Name', required: true, placeholder: 'Kasigau Corridor REDD+' },
  { key: 'type', label: 'Project Type', placeholder: 'avoided-deforestation' },
  { key: 'country', label: 'Country', placeholder: 'Kenya' },
  { key: 'methodology', label: 'Methodology', placeholder: 'VM0009' },
  { key: 'hectares', label: 'Hectares', type: 'number' },
  { key: 'baseline_period', label: 'Baseline Period', placeholder: '2018-2023' },
  { key: 'notes', label: 'Project Notes', type: 'textarea', fullWidth: true, placeholder: 'Dryland forest protection between Tsavo parks…' },
];

export default function AISynthesizeMRVPage() {
  return (
    <AIPage
      title="AI Synthesize MRV"
      subtitle="Auto-draft MRV reports, monitoring plans, and QA/QC procedures."
      fields={fields}
      buildPayload={(v) => v}
      runAI={(project) => aiSynthesizeMRV(project)}
      examplePrompt="Provide project parameters and the AI returns a structured MRV report draft with monitoring plan."
      feature="synthesize-mrv"
    />
  );
}
