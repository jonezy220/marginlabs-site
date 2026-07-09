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

// Quick Start Call: priced inline against the existing Stripe product so no
// separate price ID is needed. $379 one-time. After payment the success page
// hands off to the free Google Calendar "Margin Labs Quickstart" booking page.
const QSC_PRODUCT_ID = 'prod_Ur4G5QwKXF4uBI';
const QSC_AMOUNT = 37900; // $379.00 in cents

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product } = req.body || {};

  // Build line_items: QSC uses inline price_data on the product; tiers use price IDs.
  let line_items;
  if (product === 'qsc') {
    line_items = [{
      price_data: {
        currency: 'usd',
        product: QSC_PRODUCT_ID,
        unit_amount: QSC_AMOUNT,
      },
      quantity: 1,
    }];
  } else {
    const priceId = PRICE_IDS[product] || PRICE_IDS.tier1;
    if (!priceId) {
      return res.status(400).json({ error: 'Product not available yet' });
    }
    line_items = [{ price: priceId, quantity: 1 }];
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
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
