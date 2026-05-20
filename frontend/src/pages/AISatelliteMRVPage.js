import React from 'react';
import AIPage from '../components/AIPage';
import { aiSatelliteMRV } from '../services/api';

const fields = [
  { key: 'name', label: 'Project Name', required: true, placeholder: 'Sumatra Mangrove Blue Carbon' },
  { key: 'type', label: 'Project Type', placeholder: 'blue-carbon' },
  { key: 'country', label: 'Country', placeholder: 'Indonesia' },
  { key: 'imagery_period', label: 'Imagery Period (e.g. 2023-Q1..2024-Q1)', required: true, placeholder: '2023-Q1..2024-Q1' },
];

export default function AISatelliteMRVPage() {
  return (
    <AIPage
      title="AI Satellite MRV"
      subtitle="Derive MRV signal (NDVI delta, canopy loss, alerts) from satellite imagery for a period."
      fields={fields}
      buildPayload={(v) => ({ project: { name: v.name, type: v.type, country: v.country }, imagery_period: v.imagery_period })}
      runAI={({ project, imagery_period }) => aiSatelliteMRV(project, imagery_period)}
      examplePrompt="Provide a project + imagery period. AI returns MRV signal anchored to satellite observations."
      feature="satellite-mrv"
    />
  );
}
