const stripe   = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto   = require('crypto');
const { Redis } = require('@upstash/redis');
const { sendDeliveryEmail } = require('./send-delivery-email');

const redis = new Redis({
  url:   process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const PRICE_TO_PRODUCT = {
  'price_1TErFkENN4Yp4lBxmuHE2r1G': 'tier1',
  [process.env.TIER2_PRICE_ID]:      'tier2',
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // If webhook secret not yet configured, process without verification
  let event;
  try {
    if (secret && sig) {
      const rawBody = await getRawBody(req);
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } else {
      event = req.body;
    }
  } catch(err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email   = session.customer_details?.email;
    const product = session.metadata?.product || detectProduct(session);

    if (email) {
      const proto   = req.headers['x-forwarded-proto'] || 'https';
      const baseUrl = `${proto}://${req.headers.host}`;

      await Promise.allSettled([
        // Tag in Brevo as customer
        fetch(`${baseUrl}/api/brevo-tag`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            email,
            attributes: { SOURCE: product === 'tier2' ? 'Execution Playbook Customer' : 'Framework Customer' },
          }),
        }),
        // Send purchase confirmation via Resend
        fetch(`${baseUrl}/api/send-purchase-confirmation`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email }),
        }),
        // Generate signed download link and send delivery email
        generateAndSendDownloadLink(email, product),
      ]);
    }
  }

  res.status(200).json({ received: true });
};

async function generateAndSendDownloadLink(email, product) {
  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 72 * 60 * 60 * 1000;

  // Store download token with 72h TTL
  await redis.set(`dl:${token}`, { email, product, expiresAt, createdAt: Date.now() }, { px: 72 * 60 * 60 * 1000 });

  // Maintain secondary index for re-request lookups (90-day TTL)
  await redis.sadd(`purchases:${email}`, product);
  await redis.expire(`purchases:${email}`, 90 * 24 * 60 * 60);

  const downloadUrl = `https://marginlabs.io/api/download?token=${token}`;
  await sendDeliveryEmail(email, product, downloadUrl);
}

function detectProduct(session) {
  const lineItems = session.line_items?.data || [];
  for (const item of lineItems) {
    const mapped = PRICE_TO_PRODUCT[item.price?.id];
    if (mapped) return mapped;
  }
  return 'tier1';
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end',  () => resolve(data));
    req.on('error', reject);
  });
}
