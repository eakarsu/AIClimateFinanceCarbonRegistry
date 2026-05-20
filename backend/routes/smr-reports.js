const { buildRouter } = require('./_crud');

module.exports = buildRouter({
  table: 'smr_reports',
  entityKey: 'smr',
  columns: ['smr_id', 'project', 'period_start', 'period_end', 'monitored_tco2e', 'submitted_at'],
  orderBy: 'submitted_at',
});
