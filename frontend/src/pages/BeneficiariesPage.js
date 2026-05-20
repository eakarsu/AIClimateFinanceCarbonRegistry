import React from 'react';
import CrudPage from '../components/CrudPage';
import { beneficiariesApi } from '../services/api';

const columns = [
  { key: 'beneficiary_id', label: 'Beneficiary ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'country', label: 'Country' },
  { key: 'reported_use_year', label: 'Use Year', format: 'number' },
];

const fields = [
  { key: 'beneficiary_id', label: 'Beneficiary ID', required: true },
  { key: 'name', label: 'Name', required: true },
  { key: 'type', label: 'Type', type: 'select', options: ['corporate', 'individual'] },
  { key: 'country', label: 'Country' },
  { key: 'reported_use_year', label: 'Use Year', type: 'number' },
];

const defaults = { beneficiary_id: '', name: '', type: 'corporate', country: '', reported_use_year: new Date().getFullYear() };

export default function BeneficiariesPage() {
  return (
    <CrudPage
      title="Beneficiaries"
      subtitle="Named beneficiaries claiming credit retirements (corporates, individuals)."
      columns={columns}
      fields={fields}
      api={{ list: beneficiariesApi.list, create: beneficiariesApi.create, update: beneficiariesApi.update, remove: beneficiariesApi.remove }}
      defaults={defaults}
      statusFields={['type']}
    />
  );
}
