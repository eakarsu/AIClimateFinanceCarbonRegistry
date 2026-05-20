import React from 'react';
import AIPage from '../components/AIPage';
import { aiDoubleCountingDetect } from '../services/api';

const fields = [
  { key: 'credit_id', label: 'Credit ID', required: true, placeholder: 'CR-2021-KEN-027' },
  { key: 'project', label: 'Project', placeholder: 'Kasigau Corridor REDD+' },
  { key: 'vintage_year', label: 'Vintage Year', type: 'number' },
  { key: 'tons_co2e', label: 'tCO2e', type: 'number' },
  { key: 'methodology', label: 'Methodology', placeholder: 'VM0009' },
  { key: 'serial_number', label: 'Serial Number', placeholder: 'CR-...-SN-12345' },
];

export default function AIDoubleCountingDetectPage() {
  return (
    <AIPage
      title="AI Double-Counting Detect"
      subtitle="Score cross-registry double-counting risk on a given credit."
      fields={fields}
      buildPayload={(v) => v}
      runAI={(credit) => aiDoubleCountingDetect(credit)}
      examplePrompt="Provide credit fields. AI returns double-counting risk + cross-registry pivots."
      feature="double-counting-detect"
    />
  );
}
