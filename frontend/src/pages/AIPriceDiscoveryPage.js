import React from 'react';
import AIPage from '../components/AIPage';
import { aiPriceDiscovery } from '../services/api';

const fields = [
  { key: 'project_type', label: 'Project Type', required: true, default: 'blue-carbon' },
  { key: 'vintage', label: 'Vintage Year', type: 'number', required: true, default: 2023 },
];

export default function AIPriceDiscoveryPage() {
  return (
    <AIPage
      title="AI Price Discovery"
      subtitle="Discover live price bands + liquidity for project_type × vintage from comparables."
      fields={fields}
      buildPayload={(v) => ({ project_type: v.project_type, vintage: v.vintage })}
      runAI={({ project_type, vintage }) => aiPriceDiscovery(project_type, vintage)}
      examplePrompt="Pick a project type + vintage. AI returns price band + comparable trades."
      feature="price-discovery"
    />
  );
}
