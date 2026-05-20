import React from 'react';
import CrudPage from '../components/CrudPage';
import * as api from '../services/api';

const columns = [
  { key: 'credit_id', label: 'Credit ID' },
  { key: 'project', label: 'Project' },
  { key: 'vintage_year', label: 'Vintage' },
  { key: 'tons_co2e', label: 'tCO2e', format: 'number' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'status', label: 'Status' },
  { key: 'issued_at', label: 'Issued', format: 'date' },
];

const fields = [
  { key: 'credit_id', label: 'Credit ID', required: true },
  { key: 'project', label: 'Project', required: true },
  { key: 'vintage_year', label: 'Vintage Year', type: 'number', required: true },
  { key: 'tons_co2e', label: 'Tons CO2e', type: 'number', required: true },
  { key: 'methodology', label: 'Methodology' },
  { key: 'serial_number', label: 'Serial Number' },
  { key: 'status', label: 'Status', type: 'select', options: ['issued', 'transferred', 'retired'] },
];

const defaults = { credit_id: '', project: '', vintage_year: 2024, tons_co2e: 0, methodology: 'VM0007', serial_number: '', status: 'issued' };

export default function CreditsPage() {
  return (
    <CrudPage
      title="Credits"
      subtitle="Issued tCO2e credits per project and vintage year."
      columns={columns}
      fields={fields}
      api={{ list: api.getCredits, create: api.createCredit, update: api.updateCredit, remove: api.deleteCredit }}
      defaults={defaults}
      statusFields={['status']}
    />
  );
}
