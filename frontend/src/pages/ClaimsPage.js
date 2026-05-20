import React from 'react';
import CrudPage from '../components/CrudPage';
import { claimsApi } from '../services/api';

const columns = [
  { key: 'claim_id', label: 'Claim ID' },
  { key: 'holder', label: 'Holder' },
  { key: 'type', label: 'Type' },
  { key: 'scope', label: 'Scope' },
  { key: 'year', label: 'Year' },
  { key: 'third_party_verified', label: '3PV' },
];

const fields = [
  { key: 'claim_id', label: 'Claim ID', required: true },
  { key: 'holder', label: 'Holder', required: true },
  { key: 'type', label: 'Type', type: 'select', options: ['net-zero', 'carbon-neutral', 'SBTi'] },
  { key: 'scope', label: 'Scope', type: 'select', options: ['1+2', '1+2+3', 'partial'] },
  { key: 'year', label: 'Target Year', type: 'number' },
  { key: 'third_party_verified', label: 'Third-Party Verified', type: 'select', options: ['true', 'false'] },
];

const defaults = { claim_id: '', holder: '', type: 'net-zero', scope: '1+2+3', year: 2030, third_party_verified: 'false' };

export default function ClaimsPage() {
  return (
    <CrudPage
      title="Claims"
      subtitle="Corporate climate claims (net-zero, carbon-neutral, SBTi) with verification status."
      columns={columns}
      fields={fields}
      api={{ list: claimsApi.list, create: claimsApi.create, update: claimsApi.update, remove: claimsApi.remove }}
      defaults={defaults}
      statusFields={['type']}
    />
  );
}
