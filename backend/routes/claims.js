const { buildRouter } = require('./_crud');

module.exports = buildRouter({
  table: 'claims',
  entityKey: 'claim',
  columns: ['claim_id', 'holder', 'type', 'scope', 'year', 'third_party_verified'],
  orderBy: 'year',
});
