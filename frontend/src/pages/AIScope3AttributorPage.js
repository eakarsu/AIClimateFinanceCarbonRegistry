import React from 'react';
import AIPage from '../components/AIPage';
import { aiScope3Attributor } from '../services/api';

const fields = [
  { key: 'name', label: 'Holder Name', required: true, placeholder: 'Microsoft Corporation' },
  { key: 'type', label: 'Type', placeholder: 'corporate' },
  { key: 'country', label: 'Country', placeholder: 'United States' },
  { key: 'sector', label: 'Sector', placeholder: 'technology' },
  { key: 'revenue_musd', label: 'Revenue (USD M)', type: 'number' },
];

export default function AIScope3AttributorPage() {
  return (
    <AIPage
      title="AI Scope-3 Attributor"
      subtitle="Attribute scope-3 emissions across GHG-Protocol's 15 upstream/downstream categories."
      fields={fields}
      buildPayload={(v) => v}
      runAI={(holder) => aiScope3Attributor(holder)}
      examplePrompt="Describe a holder. AI returns scope-3 attribution by category."
      feature="scope-3-attributor"
    />
  );
}
