import React from 'react';
import AIPage from '../components/AIPage';
import { aiClimateClaimValidator } from '../services/api';

const fields = [
  { key: 'holder', label: 'Claimant', required: true, placeholder: 'Microsoft Corporation' },
  { key: 'type', label: 'Claim Type', placeholder: 'net-zero' },
  { key: 'scope', label: 'Scope', placeholder: '1+2+3' },
  { key: 'year', label: 'Target Year', type: 'number' },
  { key: 'evidence', label: 'Evidence / Supporting Statement', type: 'textarea', fullWidth: true },
];

export default function AIClimateClaimValidatorPage() {
  return (
    <AIPage
      title="AI Climate Claim Validator"
      subtitle="Detect greenwashing risk and check SBTi / VCMI / ISO-14068 / FTC Green-Guides alignment."
      fields={fields}
      buildPayload={(v) => v}
      runAI={(claim) => aiClimateClaimValidator(claim)}
      examplePrompt="Describe a corporate climate claim. AI returns validity + greenwashing risk."
      feature="climate-claim-validator"
    />
  );
}
