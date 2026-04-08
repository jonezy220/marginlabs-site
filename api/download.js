const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url:   process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const PDF_URLS = {
  tier1: process.env.TIER1_PDF_BLOB_URL,
  tier2: process.env.TIER2_PDF_BLOB_URL,
};

const PDF_NAMES = {
  tier1: 'Embedded_Payments_Strategic_Decision_Framework.pdf',
  tier2: 'Embedded_Payments_Execution_Playbook.pdf',
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.query;

  if (!token) {
    return res.redirect(302, '/download-expired');
  }

  const record = await redis.get(`dl:${token}`);

  if (!record) {
    return res.redirect(302, '/download-expired');
  }

  if (record.expiresAt < Date.now()) {
    await redis.del(`dl:${token}`);
    return res.redirect(302, '/download-expired');
  }

  const blobUrl = PDF_URLS[record.product];
  if (!blobUrl) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const filename = PDF_NAMES[record.product] || 'download.pdf';

  const blobRes = await fetch(blobUrl, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });

  if (!blobRes.ok) {
    return res.status(502).json({ error: 'File unavailable' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const buffer = await blobRes.arrayBuffer();
  res.send(Buffer.from(buffer));
};
