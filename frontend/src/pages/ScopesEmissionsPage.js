import React from 'react';
import CrudPage from '../components/CrudPage';
import { scopesEmissionsApi } from '../services/api';

const columns = [
  { key: 'scope_id', label: 'Scope ID' },
  { key: 'holder', label: 'Holder' },
  { key: 'year', label: 'Year' },
  { key: 'scope', label: 'Scope' },
  { key: 'emissions_tco2e', label: 'tCO2e', format: 'number' },
  { key: 'verified', label: 'Verified' },
];

const fields = [
  { key: 'scope_id', label: 'Scope ID', required: true },
  { key: 'holder', label: 'Holder', required: true },
  { key: 'year', label: 'Year', type: 'number', required: true },
  { key: 'scope', label: 'Scope', type: 'select', options: ['1', '2', '3'], required: true },
  { key: 'emissions_tco2e', label: 'Emissions (tCO2e)', type: 'number' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'verified', label: 'Verified', type: 'select', options: ['true', 'false'] },
];

const defaults = { scope_id: '', holder: '', year: new Date().getFullYear(), scope: '1', emissions_tco2e: 0, methodology: '', verified: 'false' };

export default function ScopesEmissionsPage() {
  return (
    <CrudPage
      title="Scope Emissions"
      subtitle="GHG-Protocol scope 1/2/3 emissions inventories per holder per year."
      columns={columns}
      fields={fields}
      api={{ list: scopesEmissionsApi.list, create: scopesEmissionsApi.create, update: scopesEmissionsApi.update, remove: scopesEmissionsApi.remove }}
      defaults={defaults}
    />
  );
}
