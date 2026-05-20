import React from 'react';
import CrudPage from '../components/CrudPage';
import { smrReportsApi } from '../services/api';

const columns = [
  { key: 'smr_id', label: 'SMR ID' },
  { key: 'project', label: 'Project' },
  { key: 'period_start', label: 'From', format: 'date' },
  { key: 'period_end', label: 'To', format: 'date' },
  { key: 'monitored_tco2e', label: 'tCO2e', format: 'number' },
  { key: 'submitted_at', label: 'Submitted', format: 'date' },
];

const fields = [
  { key: 'smr_id', label: 'SMR ID', required: true },
  { key: 'project', label: 'Project', required: true },
  { key: 'period_start', label: 'Period Start (YYYY-MM-DD)', required: true },
  { key: 'period_end', label: 'Period End (YYYY-MM-DD)', required: true },
  { key: 'monitored_tco2e', label: 'Monitored tCO2e', type: 'number' },
];

const defaults = { smr_id: '', project: '', period_start: '', period_end: '', monitored_tco2e: 0 };

export default function SMRReportsPage() {
  return (
    <CrudPage
      title="SMR Reports"
      subtitle="Subsequent monitoring & reporting periods per project."
      columns={columns}
      fields={fields}
      api={{ list: smrReportsApi.list, create: smrReportsApi.create, update: smrReportsApi.update, remove: smrReportsApi.remove }}
      defaults={defaults}
    />
  );
}
