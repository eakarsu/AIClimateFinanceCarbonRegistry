import React from 'react';
import CrudPage from '../components/CrudPage';
import { correspondingAdjustmentsApi } from '../services/api';

const columns = [
  { key: 'adjustment_id', label: 'Adjustment ID' },
  { key: 'host_country', label: 'Host' },
  { key: 'acquiring_country', label: 'Acquirer' },
  { key: 'project', label: 'Project' },
  { key: 'vintage_year', label: 'Vintage' },
  { key: 'tons_co2e', label: 'tCO2e', format: 'number' },
  { key: 'article', label: 'Article' },
  { key: 'authorization_status', label: 'Auth Status' },
  { key: 'corresponding_adjustment_applied', label: 'CA Applied' },
  { key: 'first_transfer_at', label: 'Transferred', format: 'date' },
];

const fields = [
  { key: 'adjustment_id', label: 'Adjustment ID', required: true },
  { key: 'host_country', label: 'Host Country', required: true },
  { key: 'acquiring_country', label: 'Acquiring Country' },
  { key: 'project', label: 'Project' },
  { key: 'vintage_year', label: 'Vintage Year', type: 'number' },
  { key: 'tons_co2e', label: 'Tons CO2e', type: 'number', required: true },
  { key: 'article', label: 'Article', type: 'select', options: ['6.2', '6.4'] },
  { key: 'authorization_status', label: 'Authorization', type: 'select', options: ['pending', 'authorized', 'revoked'] },
  { key: 'corresponding_adjustment_applied', label: 'CA Applied', type: 'select', options: ['true', 'false'] },
  { key: 'first_transfer_at', label: 'First Transfer At' },
  { key: 'cancelled_at', label: 'Cancelled At' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

const defaults = {
  adjustment_id: '', host_country: '', acquiring_country: '', project: '', vintage_year: 0,
  tons_co2e: 0, article: '6.2', authorization_status: 'pending',
  corresponding_adjustment_applied: 'false', first_transfer_at: '', cancelled_at: '', notes: '',
};

export default function CorrespondingAdjustmentsPage() {
  return (
    <CrudPage
      title="Corresponding Adjustments"
      subtitle="Paris Agreement Article 6.2 / 6.4 ITMO authorization + corresponding-adjustment tracker."
      columns={columns}
      fields={fields}
      api={{
        list: correspondingAdjustmentsApi.list,
        create: correspondingAdjustmentsApi.create,
        update: correspondingAdjustmentsApi.update,
        remove: correspondingAdjustmentsApi.remove,
      }}
      defaults={defaults}
    />
  );
}
