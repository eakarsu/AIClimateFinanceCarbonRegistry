import React from 'react';
import CrudPage from '../components/CrudPage';
import { retirementsApi } from '../services/api';

const columns = [
  { key: 'retirement_id', label: 'Retirement ID' },
  { key: 'credits_amount', label: 'Credits', format: 'number' },
  { key: 'beneficiary', label: 'Beneficiary' },
  { key: 'claim', label: 'Claim', format: 'truncate' },
  { key: 'retired_at', label: 'Retired', format: 'date' },
];

const fields = [
  { key: 'retirement_id', label: 'Retirement ID', required: true },
  { key: 'credits_amount', label: 'Credits Amount', type: 'number', required: true },
  { key: 'beneficiary', label: 'Beneficiary' },
  { key: 'claim', label: 'Claim', type: 'textarea', fullWidth: true },
  { key: 'certificate_url', label: 'Certificate URL', fullWidth: true },
];

const defaults = { retirement_id: '', credits_amount: 0, beneficiary: '', claim: '', certificate_url: '' };

export default function RetirementsPage() {
  return (
    <CrudPage
      title="Retirements"
      subtitle="Permanent credit cancellations against beneficiary claims with certificates."
      columns={columns}
      fields={fields}
      api={{ list: retirementsApi.list, create: retirementsApi.create, update: retirementsApi.update, remove: retirementsApi.remove }}
      defaults={defaults}
    />
  );
}
