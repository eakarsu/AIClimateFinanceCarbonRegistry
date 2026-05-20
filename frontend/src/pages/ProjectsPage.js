import React from 'react';
import CrudPage from '../components/CrudPage';
import * as api from '../services/api';

const columns = [
  { key: 'project_id', label: 'Project ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'country', label: 'Country' },
  { key: 'hectares', label: 'Hectares', format: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'registered_at', label: 'Registered', format: 'date' },
];

const fields = [
  { key: 'project_id', label: 'Project ID', required: true },
  { key: 'name', label: 'Name', required: true },
  { key: 'type', label: 'Type', type: 'select', options: ['reforestation', 'avoided-deforestation', 'renewables', 'methane-capture', 'cookstoves', 'blue-carbon'], required: true },
  { key: 'country', label: 'Country', required: true },
  { key: 'hectares', label: 'Hectares', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['pending', 'active', 'verified', 'retired'] },
  { key: 'developer', label: 'Developer' },
  { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
];

const defaults = { project_id: '', name: '', type: 'reforestation', country: '', hectares: 0, status: 'pending', description: '', developer: '' };

export default function ProjectsPage() {
  return (
    <CrudPage
      title="Projects"
      subtitle="Registered carbon projects with type, location, hectares, and status."
      columns={columns}
      fields={fields}
      api={{ list: api.getProjects, create: api.createProject, update: api.updateProject, remove: api.deleteProject }}
      defaults={defaults}
      statusFields={['status']}
    />
  );
}
