import React from 'react';
import CrudPage from '../components/CrudPage';
import * as api from '../services/api';

const columns = [
  { key: 'issuance_id', label: 'Issuance ID' },
  { key: 'project', label: 'Project' },
  { key: 'vintage_year', label: 'Vintage' },
  { key: 'tons_issued', label: 'Tons Issued', format: 'number' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'issued_by', label: 'Issued By' },
  { key: 'issued_at', label: 'Issued', format: 'date' },
];

const fields = [
  { key: 'issuance_id', label: 'Issuance ID', required: true },
  { key: 'project', label: 'Project', required: true },
  { key: 'vintage_year', label: 'Vintage Year', type: 'number', required: true },
  { key: 'tons_issued', label: 'Tons Issued', type: 'number', required: true },
  { key: 'methodology', label: 'Methodology' },
  { key: 'issued_by', label: 'Issued By', type: 'select', options: ['Verra', 'Gold-Standard', 'ACR'] },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

const defaults = { issuance_id: '', project: '', vintage_year: 2024, tons_issued: 0, methodology: 'VM0007', issued_by: 'Verra', notes: '' };

export default function IssuancesPage() {
  return (
    <CrudPage
      title="Issuances"
      subtitle="Credit-issuance events linking projects, vintages, and registry approvals."
      columns={columns}
      fields={fields}
      api={{ list: api.getIssuances, create: api.createIssuance, update: api.updateIssuance, remove: api.deleteIssuance }}
      defaults={defaults}
      statusFields={['issued_by']}
    />
  );
}
