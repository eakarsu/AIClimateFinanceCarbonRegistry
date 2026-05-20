import React from 'react';
import AIPage from '../components/AIPage';
import { aiLeakageModeler } from '../services/api';

const fields = [
  { key: 'name', label: 'Project Name', required: true, placeholder: 'Kasigau Corridor REDD+' },
  { key: 'type', label: 'Project Type', required: true, placeholder: 'avoided-deforestation' },
  { key: 'country', label: 'Country', placeholder: 'Kenya' },
  { key: 'hectares', label: 'Hectares', type: 'number' },
  { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
];

export default function AILeakageModelerPage() {
  return (
    <AIPage
      title="AI Leakage Modeler"
      subtitle="Quantify leakage class, expected percentage, and sensitivity drivers."
      fields={fields}
      buildPayload={(v) => v}
      runAI={(project) => aiLeakageModeler(project)}
      examplePrompt="Describe a project. AI returns a leakage model with sensitivity to key drivers."
      feature="leakage-modeler"
    />
  );
}
