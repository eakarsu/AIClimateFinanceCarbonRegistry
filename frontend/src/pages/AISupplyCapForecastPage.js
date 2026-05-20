import React from 'react';
import AIPage from '../components/AIPage';
import { aiSupplyCapForecast } from '../services/api';

const fields = [
  { key: 'project_type', label: 'Project Type', required: true, default: 'avoided-deforestation' },
];

export default function AISupplyCapForecastPage() {
  return (
    <AIPage
      title="AI Supply-Cap Forecast"
      subtitle="Project supply curve over 5 years + cap-shortfall risk + policy levers."
      fields={fields}
      buildPayload={(v) => ({ project_type: v.project_type })}
      runAI={({ project_type }) => aiSupplyCapForecast(project_type)}
      examplePrompt="Pick a project type. AI returns 5-year supply forecast + cap-shortfall risk."
      feature="supply-cap-forecast"
    />
  );
}
