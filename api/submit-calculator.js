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
    email, arrLabel, volLabel, curLabel, vertLabel,
    recModel, gapAmt, ctaType, modelSummary
  } = req.body;

  if (!email) return res.status(400).json({ error: 'Missing email' });

  const proto   = req.headers['x-forwarded-proto'] || 'https';
  const host    = req.headers.host;
  const baseUrl = `${proto}://${host}`;
  const formspreeId = process.env.FORMSPREE_ID || 'xwvrzrov';

  await Promise.allSettled([

    // 1. Formspree — notify you at hello@marginlabs.io
    fetch(`https://formspree.io/f/${formspreeId}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        email,
        source:          'Margin Multiplier',
        arr:             arrLabel || 'Not specified',
        volume:          volLabel,
        current_model:   curLabel,
        vertical:        vertLabel || 'Not specified',
        recommended:     recModel,
        opportunity_gap: gapAmt,
        next_step:       ctaType === 'primer' ? 'Get the Framework' : 'Consulting conversation',
        model_summary:   modelSummary,
        _subject:        `Margin Multiplier — ${email} — ${volLabel}`,
        _replyto:        email,
      }),
    }),

    // 2. Resend — send confirmation email to visitor
    fetch(`${baseUrl}/api/send-confirmation`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, volLabel, curLabel, recModel,
        gapAmt, modelSummary, arrLabel, vertLabel,
      }),
    }),

    // 3. Brevo — add to CRM with full context + Multiplier Leads list
    fetch(`${baseUrl}/api/brevo-subscribe`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        volLabel,
        curModel:  curLabel,
        recModel,
        ctaType,
        gapAmt,
        source:    'Margin Multiplier Calculator',
        additionalListIds: [4],
        extraAttributes: { HAS_MULTIPLIER: true, ENTRY_DATE: new Date().toISOString().split('T')[0] },
      }),
    }),

  ]);

  // Always return success — never block user on backend failures
  res.status(200).json({ ok: true });
};
