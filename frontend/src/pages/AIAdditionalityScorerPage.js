import React from 'react';
import AIPage from '../components/AIPage';
import { aiAdditionalityScorer } from '../services/api';

const fields = [
  { key: 'name', label: 'Project Name', required: true, placeholder: 'Gujarat Wind Power Project' },
  { key: 'type', label: 'Project Type', placeholder: 'renewables' },
  { key: 'country', label: 'Country', placeholder: 'India' },
  { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
];

export default function AIAdditionalityScorerPage() {
  return (
    <AIPage
      title="AI Additionality Scorer"
      subtitle="Score additionality with explicit counterfactual + investment / barrier / regulatory tests."
      fields={fields}
      buildPayload={(v) => v}
      runAI={(project) => aiAdditionalityScorer(project)}
      examplePrompt="Describe a project. AI returns an additionality score + counterfactual baseline."
      feature="additionality-scorer"
    />
  );
}
