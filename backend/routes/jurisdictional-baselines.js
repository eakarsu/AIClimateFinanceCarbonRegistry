const { buildRouter } = require('./_crud');

module.exports = buildRouter({
  table: 'jurisdictional_baselines',
  entityKey: 'baseline',
  columns: ['baseline_id', 'jurisdiction', 'sector', 'year', 'baseline_tco2e', 'reference'],
  orderBy: 'year',
});
