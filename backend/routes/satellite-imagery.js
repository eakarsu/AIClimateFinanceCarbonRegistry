const { buildRouter } = require('./_crud');

module.exports = buildRouter({
  table: 'satellite_imagery',
  entityKey: 'image',
  columns: ['image_id', 'project', 'captured_at', 'source', 'ndvi_avg', 'area_change_pct'],
  orderBy: 'captured_at',
});
