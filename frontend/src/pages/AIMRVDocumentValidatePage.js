import React from 'react';
import AIPage from '../components/AIPage';
import { aiMrvDocumentValidate } from '../services/api';

const fields = [
  { key: 'project_name', label: 'Project Name', required: true, placeholder: 'Kasigau Corridor REDD+ Phase II' },
  { key: 'methodology', label: 'Methodology', required: true, placeholder: 'VM0009' },
  { key: 'monitoring_period', label: 'Monitoring Period', placeholder: '2022-01-01..2022-12-31' },
  { key: 'baseline_emissions_tco2e', label: 'Baseline Emissions (tCO2e)', type: 'number' },
  { key: 'project_emissions_tco2e', label: 'Project Emissions (tCO2e)', type: 'number' },
  { key: 'leakage_tco2e', label: 'Leakage (tCO2e)', type: 'number' },
  { key: 'ndvi_delta', label: 'NDVI Delta', type: 'number' },
  { key: 'sampling_design', label: 'Sampling Design', type: 'textarea', fullWidth: true },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function AIMRVDocumentValidatePage() {
  return (
    <AIPage
      title="AI MRV-Document Validator"
      subtitle="Structured validation of MRV reports against methodology rules (VM0007, VM0009, VM0033, VM0047, ACR, etc.)."
      fields={fields}
      buildPayload={(v) => {
        const { methodology, ...rest } = v;
        return { mrv_document: rest, methodology };
      }}
      runAI={({ mrv_document, methodology }) => aiMrvDocumentValidate(mrv_document, methodology)}
      examplePrompt="Describe an MRV submission. AI checks methodology compliance + structured rule pass/fail."
      feature="mrv-document-validate"
    />
  );
}
