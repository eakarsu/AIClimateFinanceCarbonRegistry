import React from 'react';
import AIPage from '../components/AIPage';
import { aiBiodiversityCoBenefit } from '../services/api';

const fields = [
  { key: 'name', label: 'Project Name', required: true, placeholder: 'Rimba Raya Biodiversity Reserve' },
  { key: 'type', label: 'Project Type', placeholder: 'avoided-deforestation' },
  { key: 'country', label: 'Country', placeholder: 'Indonesia' },
  { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
];

export default function AIBiodiversityCoBenefitPage() {
  return (
    <AIPage
      title="AI Biodiversity Co-Benefit"
      subtitle="Score biodiversity impact (species, habitat, IUCN red-list overlap) for a project."
      fields={fields}
      buildPayload={(v) => v}
      runAI={(project) => aiBiodiversityCoBenefit(project)}
      examplePrompt="Describe a project. AI returns biodiversity impact + CCB eligibility verdict."
      feature="biodiversity-co-benefit"
    />
  );
}
