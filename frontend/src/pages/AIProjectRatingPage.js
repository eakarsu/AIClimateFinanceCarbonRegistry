import React from 'react';
import AIPage from '../components/AIPage';
import { aiProjectRating } from '../services/api';

const fields = [
  { key: 'name', label: 'Project Name', required: true, placeholder: 'Katingan Mentaya Peatland' },
  { key: 'type', label: 'Project Type', placeholder: 'avoided-deforestation' },
  { key: 'country', label: 'Country', placeholder: 'Indonesia' },
  { key: 'hectares', label: 'Hectares', type: 'number' },
  { key: 'methodology', label: 'Methodology', placeholder: 'VM0007' },
  { key: 'vintage_range', label: 'Vintage Range', placeholder: '2010-2024' },
  { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
];

export default function AIProjectRatingPage() {
  return (
    <AIPage
      title="AI Project Composite Rating"
      subtitle="BeZero / Sylvera-style composite grade — additionality + permanence + leakage + co-benefits + MRV quality + governance."
      fields={fields}
      buildPayload={(v) => v}
      runAI={(project) => aiProjectRating(project)}
      examplePrompt="Describe a carbon project. AI returns AAA-D composite grade + sub-scores + peer comparison."
      feature="project-rating"
    />
  );
}
