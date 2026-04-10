module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, attributes, listIds } = req.body;
  if (!email || !attributes) return res.status(400).json({ error: 'Missing email or attributes' });

  try {
    // Brevo update contact by email — encode email for URL
    const encoded = encodeURIComponent(email);
    const response = await fetch(`https://api.brevo.com/v3/contacts/${encoded}`, {
      method:  'PUT',
      headers: {
        'Content-Type': 'application/json',
        'api-key':       process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({ attributes }),
    });

    if (!response.ok && response.status !== 204) {
      // Contact may not exist yet — create them
      const createListIds = [2, ...(Array.isArray(listIds) ? listIds : [])];
      await fetch('https://api.brevo.com/v3/contacts', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key':       process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({ email, attributes, listIds: createListIds, updateEnabled: true }),
      });
    } else if (Array.isArray(listIds) && listIds.length > 0) {
      // Contact exists — add to additional lists
      for (const lid of listIds) {
        await fetch(`https://api.brevo.com/v3/contacts/lists/${lid}/contacts/add`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
          body: JSON.stringify({ emails: [email] }),
        }).catch(() => {});
      }
    }

    res.status(200).json({ ok: true });
  } catch(err) {
    console.error('Brevo tag error:', err);
    res.status(200).json({ ok: true });
  }
};
