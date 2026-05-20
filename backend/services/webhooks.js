const crypto = require('crypto');
const pool = require('../config/database');

function signPayload(secret, body) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

// Fire a webhook to all active subscribers for a given event.
// Logs every delivery (status, body) in webhook_deliveries.
async function fireWebhook(event, payload) {
  let rows = [];
  try {
    const r = await pool.query('SELECT * FROM webhooks WHERE active=true AND $1 = ANY(events)', [event]);
    rows = r.rows;
  } catch (e) {
    console.warn('[webhooks] lookup failed:', e.message);
    return;
  }

  for (const hook of rows) {
    const body = JSON.stringify({ event, payload, ts: new Date().toISOString() });
    const sig = signPayload(hook.secret, body);
    let status = 0;
    let respBody = '';
    try {
      const res = await fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Carbon-Signature': `sha256=${sig}`,
          'X-Carbon-Event': event,
        },
        body,
      });
      status = res.status;
      respBody = (await res.text()).slice(0, 1024);
    } catch (e) {
      status = 0;
      respBody = e.message;
    }
    try {
      await pool.query(
        `INSERT INTO webhook_deliveries (webhook_id, event, payload, signature, response_status, response_body)
         VALUES ($1,$2,$3::jsonb,$4,$5,$6)`,
        [hook.id, event, JSON.stringify(payload), `sha256=${sig}`, status, respBody]
      );
    } catch (e) {
      console.warn('[webhooks] log insert failed:', e.message);
    }
  }
}

module.exports = { fireWebhook, signPayload };
