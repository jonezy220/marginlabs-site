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
    email, firstName, volLabel, curModel, recModel,
    ctaType, gapAmt, source, additionalListIds, extraAttributes
  } = req.body;

  if (!email) return res.status(400).json({ error: 'Missing email' });

  const attributes = {};
  if (volLabel)  attributes.PAYMENTS_VOLUME   = volLabel;
  if (curModel)  attributes.CURRENT_MODEL     = curModel;
  if (recModel)  attributes.RECOMMENDED_MODEL = recModel;
  if (gapAmt)    attributes.OPPORTUNITY_GAP   = gapAmt;
  if (ctaType)   attributes.NEXT_STEP         = ctaType === 'primer' ? 'Get the Framework' : 'Consulting conversation';
  if (source)    attributes.SOURCE            = source;

  // Merge any extra attributes passed by callers (e.g. HAS_FREE_GUIDE, HAS_MULTIPLIER)
  if (extraAttributes && typeof extraAttributes === 'object') {
    Object.assign(attributes, extraAttributes);
  }

  // Build list IDs: always include master list (2), plus any additional lists
  const listIds = [2];
  if (Array.isArray(additionalListIds)) {
    for (const id of additionalListIds) {
      if (!listIds.includes(id)) listIds.push(id);
    }
  }

  const payload = {
    email,
    attributes,
    listIds,
    updateEnabled: true,
  };

  if (firstName) payload.firstName = firstName;

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key':       process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    // 201 = created, 204 = updated — both are success
    if (!response.ok && response.status !== 204) {
      const err = await response.text();
      console.error('Brevo subscribe error:', err);
      // Never fail the user experience on CRM errors
    }

    res.status(200).json({ ok: true });
  } catch(err) {
    console.error('Brevo subscribe error:', err);
    // Silent fail
    res.status(200).json({ ok: true, warning: 'CRM sync failed silently' });
  }
};
