import React from 'react';
import AIPage from '../components/AIPage';
import { aiMapMethodology } from '../services/api';

const fields = [
  { key: 'name', label: 'Project Name', required: true, placeholder: 'Sumatra Mangrove Blue Carbon' },
  { key: 'type', label: 'Project Type', required: true, placeholder: 'blue-carbon' },
  { key: 'country', label: 'Country', placeholder: 'Indonesia' },
  { key: 'hectares', label: 'Hectares', type: 'number' },
  { key: 'description', label: 'Description', type: 'textarea', fullWidth: true, placeholder: 'Mangrove restoration along Riau coastline…' },
];

export default function AIMapMethodologyPage() {
  return (
    <AIPage
      title="AI Map Methodology"
      subtitle="Auto-match projects to applicable methodologies and surface compliance gaps."
      fields={fields}
      buildPayload={(v) => v}
      runAI={(project) => aiMapMethodology(project)}
      examplePrompt="Describe a project. AI returns ranked methodology recommendations and gap analysis."
      feature="map-methodology"
    />
  );
}
