// Composite project ratings (Pass 7 — backlog item #4 storage side).

const { buildRouter } = require('./_crud');

module.exports = buildRouter({
  table: 'project_ratings',
  entityKey: 'project_rating',
  columns: [
    'rating_id', 'project', 'composite_grade', 'composite_score',
    'additionality', 'permanence', 'leakage_control', 'co_benefits',
    'mrv_quality', 'governance', 'ccp_eligibility', 'rated_by', 'rated_at', 'notes',
  ],
  orderBy: 'rated_at',
});
