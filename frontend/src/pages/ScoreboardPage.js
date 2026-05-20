import React from 'react';
import CrudPage from '../components/CrudPage';
import { scoreboardApi } from '../services/api';

const columns = [
  { key: 'score_id', label: 'Score ID' },
  { key: 'project', label: 'Project' },
  { key: 'ccp_eligible', label: 'CCP Eligible' },
  { key: 'sylvera_grade', label: 'Sylvera' },
  { key: 'btn_grade', label: 'BTN' },
  { key: 'last_updated', label: 'Updated', format: 'date' },
];

const fields = [
  { key: 'score_id', label: 'Score ID', required: true },
  { key: 'project', label: 'Project', required: true },
  { key: 'ccp_eligible', label: 'CCP Eligible', type: 'select', options: ['yes', 'no', 'pending'] },
  { key: 'sylvera_grade', label: 'Sylvera Grade', type: 'select', options: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'D'] },
  { key: 'btn_grade', label: 'BTN Grade', type: 'select', options: ['A+', 'A', 'B', 'C', 'D'] },
];

const defaults = { score_id: '', project: '', ccp_eligible: 'pending', sylvera_grade: 'A', btn_grade: 'A' };

export default function ScoreboardPage() {
  return (
    <CrudPage
      title="Scoreboard"
      subtitle="Third-party ratings (CCP / Sylvera / BeZero) per project."
      columns={columns}
      fields={fields}
      api={{ list: scoreboardApi.list, create: scoreboardApi.create, update: scoreboardApi.update, remove: scoreboardApi.remove }}
      defaults={defaults}
      statusFields={['ccp_eligible']}
    />
  );
}
