const { buildRouter } = require('./_crud');

module.exports = buildRouter({
  table: 'scoreboard',
  entityKey: 'score',
  columns: ['score_id', 'project', 'ccp_eligible', 'sylvera_grade', 'btn_grade', 'last_updated'],
  orderBy: 'last_updated',
});
