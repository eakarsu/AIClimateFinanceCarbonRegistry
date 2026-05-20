import React from 'react';
import AIPage from '../components/AIPage';
import { aiRegistryArbitrage } from '../services/api';

const fields = [
  { key: 'project_type', label: 'Project Type', required: true, placeholder: 'avoided-deforestation', default: 'avoided-deforestation' },
];

export default function AIRegistryArbitragePage() {
  return (
    <AIPage
      title="AI Registry Arbitrage"
      subtitle="Cross-registry (Verra / GS / ACR / CAR) price spreads with arbitrage drivers."
      fields={fields}
      buildPayload={(v) => ({ project_type: v.project_type })}
      runAI={({ project_type }) => aiRegistryArbitrage(project_type)}
      examplePrompt="Pick a project type. AI returns indicative pricing per registry + spreads."
      feature="registry-arbitrage"
    />
  );
}
