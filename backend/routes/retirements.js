const { buildRouter } = require('./_crud');
const { fireWebhook } = require('../services/webhooks');

const router = buildRouter({
  table: 'retirements',
  entityKey: 'retirement',
  columns: ['retirement_id', 'credits_amount', 'beneficiary', 'claim', 'retired_at', 'certificate_url'],
  orderBy: 'retired_at',
});

// Wrap POST so we also fire a webhook + notification on creation.
const originalPost = router.stack.find((l) => l.route && l.route.path === '/' && l.route.methods.post);
if (originalPost) {
  const handlers = originalPost.route.stack;
  const origCreate = handlers[handlers.length - 1].handle;
  handlers[handlers.length - 1].handle = async function (req, res) {
    // capture json response by monkey-patching res
    const origJson = res.json.bind(res);
    res.json = (data) => {
      try {
        if (data && data.retirement_id) {
          fireWebhook('retirement', data).catch(() => {});
          require('../services/notifications')
            .notify('retirement', `Retirement ${data.retirement_id}`, `${data.credits_amount} tCO2e retired for ${data.beneficiary || 'beneficiary'}`)
            .catch(() => {});
        }
      } catch (_) {}
      return origJson(data);
    };
    return origCreate(req, res);
  };
}

module.exports = router;
