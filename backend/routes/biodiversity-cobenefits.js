const { buildRouter } = require('./_crud');

module.exports = buildRouter({
  table: 'biodiversity_cobenefits',
  entityKey: 'cobenefit',
  columns: ['co_id', 'project', 'indicator', 'baseline', 'current'],
  orderBy: 'created_at',
});
