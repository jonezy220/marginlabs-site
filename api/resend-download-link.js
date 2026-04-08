const crypto   = require('crypto');
const { Redis } = require('@upstash/redis');
const { sendDeliveryEmail } = require('./send-delivery-email');

const redis = new Redis({
  url:   process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const normalized = email.toLowerCase().trim();

  // Rate limit: 3 re-requests per email per 24h
  const rateLimitKey = `rl:resend:${normalized}`;
  const count = await redis.incr(rateLimitKey);
  if (count === 1) {
    await redis.expire(rateLimitKey, 24 * 60 * 60);
  }
  if (count > 3) {
    // Neutral success — don't reveal rate limit details
    return res.status(200).json({ ok: true });
  }

  // Look up purchases by email via secondary index
  const products = await redis.smembers(`purchases:${normalized}`);

  if (!products || products.length === 0) {
    // Neutral success — don't confirm whether email exists
    return res.status(200).json({ ok: true });
  }

  // Generate fresh tokens for each product purchased
  const expiresAt = Date.now() + 72 * 60 * 60 * 1000;

  await Promise.allSettled(products.map(async (product) => {
    const token = crypto.randomBytes(32).toString('hex');
    await redis.set(`dl:${token}`, { email: normalized, product, expiresAt, createdAt: Date.now() }, { px: 72 * 60 * 60 * 1000 });
    const downloadUrl = `https://marginlabs.io/api/download?token=${token}`;
    await sendDeliveryEmail(normalized, product, downloadUrl);
  }));

  res.status(200).json({ ok: true });
};
