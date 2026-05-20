const { buildRouter } = require('./_crud');

module.exports = buildRouter({
  table: 'beneficiaries',
  entityKey: 'beneficiary',
  columns: ['beneficiary_id', 'name', 'type', 'country', 'reported_use_year'],
  orderBy: 'created_at',
});
