import React from 'react';
import CrudPage from '../components/CrudPage';
import { projectRatingsApi } from '../services/api';

const columns = [
  { key: 'rating_id', label: 'Rating ID' },
  { key: 'project', label: 'Project' },
  { key: 'composite_grade', label: 'Grade' },
  { key: 'composite_score', label: 'Score', format: 'number' },
  { key: 'additionality', label: 'Add' },
  { key: 'permanence', label: 'Perm' },
  { key: 'leakage_control', label: 'Leak' },
  { key: 'co_benefits', label: 'Co-Ben' },
  { key: 'mrv_quality', label: 'MRV' },
  { key: 'governance', label: 'Gov' },
  { key: 'ccp_eligibility', label: 'CCP' },
  { key: 'rated_at', label: 'Rated', format: 'date' },
];

const fields = [
  { key: 'rating_id', label: 'Rating ID', required: true },
  { key: 'project', label: 'Project', required: true },
  { key: 'composite_grade', label: 'Composite Grade', type: 'select', options: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'D'] },
  { key: 'composite_score', label: 'Composite Score', type: 'number' },
  { key: 'additionality', label: 'Additionality', type: 'number' },
  { key: 'permanence', label: 'Permanence', type: 'number' },
  { key: 'leakage_control', label: 'Leakage Control', type: 'number' },
  { key: 'co_benefits', label: 'Co-Benefits', type: 'number' },
  { key: 'mrv_quality', label: 'MRV Quality', type: 'number' },
  { key: 'governance', label: 'Governance', type: 'number' },
  { key: 'ccp_eligibility', label: 'CCP Eligibility', type: 'select', options: ['yes', 'no', 'pending'] },
  { key: 'rated_by', label: 'Rated By' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

const defaults = {
  rating_id: '', project: '', composite_grade: 'BBB', composite_score: 0,
  additionality: 0, permanence: 0, leakage_control: 0, co_benefits: 0,
  mrv_quality: 0, governance: 0, ccp_eligibility: 'pending', rated_by: '', notes: '',
};

export default function ProjectRatingsPage() {
  return (
    <CrudPage
      title="Project Ratings"
      subtitle="Composite BeZero / Sylvera-style ratings: additionality + permanence + leakage + co-benefits + MRV + governance."
      columns={columns}
      fields={fields}
      api={{
        list: projectRatingsApi.list,
        create: projectRatingsApi.create,
        update: projectRatingsApi.update,
        remove: projectRatingsApi.remove,
      }}
      defaults={defaults}
    />
  );
}
