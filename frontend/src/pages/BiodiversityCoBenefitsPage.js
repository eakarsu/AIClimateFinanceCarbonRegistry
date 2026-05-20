import React from 'react';
import CrudPage from '../components/CrudPage';
import { biodiversityCobenefitsApi } from '../services/api';

const columns = [
  { key: 'co_id', label: 'CO ID' },
  { key: 'project', label: 'Project' },
  { key: 'indicator', label: 'Indicator' },
  { key: 'baseline', label: 'Baseline', format: 'number' },
  { key: 'current', label: 'Current', format: 'number' },
];

const fields = [
  { key: 'co_id', label: 'Co-Benefit ID', required: true },
  { key: 'project', label: 'Project', required: true },
  { key: 'indicator', label: 'Indicator', type: 'select', options: ['species-count', 'habitat-area', 'water-quality'] },
  { key: 'baseline', label: 'Baseline', type: 'number' },
  { key: 'current', label: 'Current', type: 'number' },
];

const defaults = { co_id: '', project: '', indicator: 'species-count', baseline: 0, current: 0 };

export default function BiodiversityCoBenefitsPage() {
  return (
    <CrudPage
      title="Biodiversity Co-Benefits"
      subtitle="Per-project biodiversity indicators with baseline vs current measurement."
      columns={columns}
      fields={fields}
      api={{ list: biodiversityCobenefitsApi.list, create: biodiversityCobenefitsApi.create, update: biodiversityCobenefitsApi.update, remove: biodiversityCobenefitsApi.remove }}
      defaults={defaults}
      statusFields={['indicator']}
    />
  );
}
