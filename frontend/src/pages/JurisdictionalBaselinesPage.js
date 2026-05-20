import React from 'react';
import CrudPage from '../components/CrudPage';
import { jurisdictionalBaselinesApi } from '../services/api';

const columns = [
  { key: 'baseline_id', label: 'Baseline ID' },
  { key: 'jurisdiction', label: 'Jurisdiction' },
  { key: 'sector', label: 'Sector' },
  { key: 'year', label: 'Year' },
  { key: 'baseline_tco2e', label: 'Baseline tCO2e', format: 'number' },
];

const fields = [
  { key: 'baseline_id', label: 'Baseline ID', required: true },
  { key: 'jurisdiction', label: 'Jurisdiction', required: true },
  { key: 'sector', label: 'Sector' },
  { key: 'year', label: 'Year', type: 'number', required: true },
  { key: 'baseline_tco2e', label: 'Baseline tCO2e', type: 'number' },
  { key: 'reference', label: 'Reference', type: 'textarea', fullWidth: true },
];

const defaults = { baseline_id: '', jurisdiction: '', sector: '', year: new Date().getFullYear(), baseline_tco2e: 0, reference: '' };

export default function JurisdictionalBaselinesPage() {
  return (
    <CrudPage
      title="Jurisdictional Baselines"
      subtitle="National & subnational baselines (FRELs) for nesting & accounting."
      columns={columns}
      fields={fields}
      api={{ list: jurisdictionalBaselinesApi.list, create: jurisdictionalBaselinesApi.create, update: jurisdictionalBaselinesApi.update, remove: jurisdictionalBaselinesApi.remove }}
      defaults={defaults}
    />
  );
}
