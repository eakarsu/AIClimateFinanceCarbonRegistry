import React from 'react';
import CrudPage from '../components/CrudPage';
import { satelliteImageryApi } from '../services/api';

const columns = [
  { key: 'image_id', label: 'Image ID' },
  { key: 'project', label: 'Project' },
  { key: 'source', label: 'Source' },
  { key: 'captured_at', label: 'Captured', format: 'date' },
  { key: 'ndvi_avg', label: 'NDVI', format: 'number' },
  { key: 'area_change_pct', label: 'Area Δ %', format: 'number' },
];

const fields = [
  { key: 'image_id', label: 'Image ID', required: true },
  { key: 'project', label: 'Project', required: true },
  { key: 'source', label: 'Source', type: 'select', options: ['Sentinel-2', 'Landsat', 'Planet'] },
  { key: 'captured_at', label: 'Captured (YYYY-MM-DD)', type: 'text' },
  { key: 'ndvi_avg', label: 'NDVI Avg', type: 'number' },
  { key: 'area_change_pct', label: 'Area Change %', type: 'number' },
];

const defaults = { image_id: '', project: '', source: 'Sentinel-2', captured_at: '', ndvi_avg: 0, area_change_pct: 0 };

export default function SatelliteImageryPage() {
  return (
    <CrudPage
      title="Satellite Imagery"
      subtitle="Per-project satellite scenes (Sentinel-2, Landsat, Planet) with NDVI & area change."
      columns={columns}
      fields={fields}
      api={{ list: satelliteImageryApi.list, create: satelliteImageryApi.create, update: satelliteImageryApi.update, remove: satelliteImageryApi.remove }}
      defaults={defaults}
      statusFields={['source']}
    />
  );
}
