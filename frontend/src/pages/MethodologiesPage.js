import React from 'react';
import CrudPage from '../components/CrudPage';
import * as api from '../services/api';

const columns = [
  { key: 'methodology_id', label: 'Methodology ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'version', label: 'Version' },
  { key: 'approved_by', label: 'Approved By' },
  { key: 'approved_at', label: 'Approved', format: 'date' },
];

const fields = [
  { key: 'methodology_id', label: 'Methodology ID', required: true },
  { key: 'name', label: 'Name', required: true, fullWidth: true },
  { key: 'type', label: 'Type' },
  { key: 'scope', label: 'Scope', fullWidth: true },
  { key: 'version', label: 'Version' },
  { key: 'approved_by', label: 'Approved By', type: 'select', options: ['Verra', 'Gold-Standard', 'ACR'] },
  { key: 'approved_at', label: 'Approved At', placeholder: 'YYYY-MM-DD' },
];

const defaults = { methodology_id: '', name: '', type: '', scope: '', version: '', approved_by: 'Verra', approved_at: '' };

export default function MethodologiesPage() {
  return (
    <CrudPage
      title="Methodologies"
      subtitle="Approved carbon accounting methodologies (Verra, Gold Standard, ACR)."
      columns={columns}
      fields={fields}
      api={{ list: api.getMethodologies, create: api.createMethodology, update: api.updateMethodology, remove: api.deleteMethodology }}
      defaults={defaults}
      statusFields={['approved_by']}
    />
  );
}
