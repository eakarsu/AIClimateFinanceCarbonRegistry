import React from 'react';
import CrudPage from '../components/CrudPage';
import * as api from '../services/api';

const columns = [
  { key: 'audit_id', label: 'Audit ID' },
  { key: 'project', label: 'Project' },
  { key: 'verifier', label: 'Verifier' },
  { key: 'finding', label: 'Finding' },
  { key: 'completed_at', label: 'Completed', format: 'date' },
];

const fields = [
  { key: 'audit_id', label: 'Audit ID', required: true },
  { key: 'project', label: 'Project', required: true },
  { key: 'verifier', label: 'Verifier', required: true },
  { key: 'finding', label: 'Finding', type: 'select', options: ['compliant', 'non-conformance', 'major-finding'], required: true },
  { key: 'report_url', label: 'Report URL', fullWidth: true },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

const defaults = { audit_id: '', project: '', verifier: '', finding: 'compliant', report_url: '', notes: '' };

export default function AuditsPage() {
  return (
    <CrudPage
      title="Audits"
      subtitle="Verifier audit findings and downloadable report URLs."
      columns={columns}
      fields={fields}
      api={{ list: api.getAudits, create: api.createAudit, update: api.updateAudit, remove: api.deleteAudit }}
      defaults={defaults}
      statusFields={['finding']}
    />
  );
}
