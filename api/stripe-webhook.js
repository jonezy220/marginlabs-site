const stripe   = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

      const results = await Promise.allSettled([
        // Tag in Brevo as customer + add to Framework Customers list
        fetch(`${baseUrl}/api/brevo-tag`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            email,
            attributes: {
              SOURCE: product === 'tier2' ? 'Execution Playbook Customer' : 'Framework Customer',
              HAS_FRAMEWORK: true,
            },
            listIds: [6],
          }),
        }),
        // Send purchase confirmation via Resend
        fetch(`${baseUrl}/api/send-purchase-confirmation`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email }),
        }),
      ]);

      // Log every step so a failed delivery is visible in Vercel runtime logs
      const labels = ['brevo-tag', 'purchase-confirmation'];
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`[stripe-webhook] ${labels[i]} FAILED for session ${session.id}:`, r.reason);
        } else if (r.value && r.value.ok === false) {
          console.error(`[stripe-webhook] ${labels[i]} returned HTTP ${r.value.status} for session ${session.id}`);
        }
      });
    }
  }

  res.status(200).json({ received: true });
};

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
