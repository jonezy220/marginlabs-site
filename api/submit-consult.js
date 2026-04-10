const CORS = {
  'Access-Control-Allow-Origin':  'https://www.marginlabs.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    name, company, email, phone, volume, current_model,
    message, availability, timezone, opportunity_gap,
    recommended, source, subject_type
  } = req.body;

  if (!email || !name) return res.status(400).json({ error: 'Missing required fields' });

  const proto   = req.headers['x-forwarded-proto'] || 'https';
  const host    = req.headers.host;
  const baseUrl = `${proto}://${host}`;

  const emailSubject = subject_type === 'simple'
    ? 'start the convo - simple'
    : 'start the convo - detailed';

  await Promise.allSettled([

    // 1. Formspree — notify you with full context
    fetch('https://formspree.io/f/mnjopjon', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name, company, email,
        phone:           phone || 'Not provided',
        volume:          volume || 'Not specified',
        current_model:   current_model || 'Not specified',
        message,
        availability:    availability || 'Not specified',
        timezone:        timezone || 'Not specified',
        opportunity_gap: opportunity_gap || '',
        recommended:     recommended || '',
        source:          source || 'Work With Us',
        _subject:        emailSubject,
        _replyto:        email,
      }),
    }),

    // 2. Brevo — add/update contact with consulting context + Advisory Leads list
    fetch(`${baseUrl}/api/brevo-subscribe`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        firstName:  name.split(' ')[0],
        volLabel:   volume,
        curModel:   current_model,
        recModel:   recommended,
        gapAmt:     opportunity_gap,
        ctaType:    'consult',
        source:     source || 'Advisory Form',
        additionalListIds: [5],
        extraAttributes: { ENTRY_DATE: new Date().toISOString().split('T')[0] },
      }),
    }),

  ]);

  res.status(200).json({ ok: true });
};
