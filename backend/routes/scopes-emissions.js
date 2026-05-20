const { buildRouter } = require('./_crud');

module.exports = buildRouter({
  table: 'scopes_emissions',
  entityKey: 'scope_emission',
  columns: ['scope_id', 'holder', 'year', 'scope', 'emissions_tco2e', 'methodology', 'verified'],
  orderBy: 'year',
});
