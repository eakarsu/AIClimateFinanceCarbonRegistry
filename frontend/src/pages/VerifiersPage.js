import React from 'react';
import CrudPage from '../components/CrudPage';
import * as api from '../services/api';

const columns = [
  { key: 'verifier_id', label: 'Verifier ID' },
  { key: 'name', label: 'Name' },
  { key: 'accreditation', label: 'Accreditation' },
  { key: 'verification_count', label: 'Verifications', format: 'number' },
  { key: 'country', label: 'Country' },
  { key: 'status', label: 'Status' },
  { key: 'last_audit_at', label: 'Last Audit', format: 'date' },
];

const fields = [
  { key: 'verifier_id', label: 'Verifier ID', required: true },
  { key: 'name', label: 'Name', required: true },
  { key: 'accreditation', label: 'Accreditation', fullWidth: true },
  { key: 'verification_count', label: 'Verification Count', type: 'number' },
  { key: 'country', label: 'Country' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'suspended', 'inactive'] },
];

const defaults = { verifier_id: '', name: '', accreditation: '', verification_count: 0, country: '', status: 'active' };

export default function VerifiersPage() {
  return (
    <CrudPage
      title="Verifiers"
      subtitle="Accredited validation & verification bodies (VVBs / DOEs)."
      columns={columns}
      fields={fields}
      api={{ list: api.getVerifiers, create: api.createVerifier, update: api.updateVerifier, remove: api.deleteVerifier }}
      defaults={defaults}
      statusFields={['status']}
    />
  );
}
