import React from 'react';
import AIPage from '../components/AIPage';
import { aiAnalyzePricing } from '../services/api';

const fields = [
  { key: 'project_type', label: 'Project Type', required: true, placeholder: 'avoided-deforestation', default: 'avoided-deforestation' },
  { key: 'vintage', label: 'Vintage Year', type: 'number', required: true, placeholder: '2023', default: 2023 },
];

export default function AIAnalyzePricingPage() {
  return (
    <AIPage
      title="AI Analyze Pricing"
      subtitle="Voluntary-carbon-market price bands and 12-month forecasts by project type and vintage."
      fields={fields}
      buildPayload={(v) => ({ project_type: v.project_type, vintage: v.vintage })}
      runAI={({ project_type, vintage }) => aiAnalyzePricing(project_type, vintage)}
      examplePrompt="Pick a project type and vintage year. AI returns current band, 12-mo forecast, and market drivers."
      feature="analyze-pricing"
    />
  );
}
