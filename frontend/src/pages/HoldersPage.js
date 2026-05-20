import React from 'react';
import CrudPage from '../components/CrudPage';
import * as api from '../services/api';

const columns = [
  { key: 'holder_id', label: 'Holder ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'country', label: 'Country' },
  { key: 'kyc_status', label: 'KYC' },
  { key: 'registered_at', label: 'Registered', format: 'date' },
];

const fields = [
  { key: 'holder_id', label: 'Holder ID', required: true },
  { key: 'name', label: 'Name', required: true },
  { key: 'type', label: 'Type', type: 'select', options: ['corporate', 'individual', 'broker', 'fund'], required: true },
  { key: 'country', label: 'Country' },
  { key: 'kyc_status', label: 'KYC Status', type: 'select', options: ['pending', 'verified', 'rejected'] },
  { key: 'email', label: 'Email' },
];

const defaults = { holder_id: '', name: '', type: 'corporate', country: '', kyc_status: 'pending', email: '' };

export default function HoldersPage() {
  return (
    <CrudPage
      title="Holders"
      subtitle="Account holders: corporates, brokers, funds, and individuals."
      columns={columns}
      fields={fields}
      api={{ list: api.getHolders, create: api.createHolder, update: api.updateHolder, remove: api.deleteHolder }}
      defaults={defaults}
      statusFields={['kyc_status']}
    />
  );
}
