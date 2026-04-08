const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CORS = {
  'Access-Control-Allow-Origin':  'https://www.marginlabs.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Stripe Price IDs — add TIER2_PRICE_ID to Vercel env vars when creating product
const PRICE_IDS = {
  tier1: 'price_1TErFkENN4Yp4lBxmuHE2r1G',
  tier2: process.env.TIER2_PRICE_ID,
};

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product } = req.body || {};
  const priceId = PRICE_IDS[product] || PRICE_IDS.tier1;

  if (!priceId) {
    return res.status(400).json({ error: 'Product not available yet' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      metadata: { product: product || 'tier1' },
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}&product=${product || 'tier1'}`,
      cancel_url: `${req.headers.origin}/#products`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
