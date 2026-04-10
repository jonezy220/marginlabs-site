const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const CORS = {
  'Access-Control-Allow-Origin':  'https://www.marginlabs.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    // Sync to Brevo: tag as free-guide-lead, set HAS_FREE_GUIDE, add to Free Guide Leads list
    const proto   = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${proto}://${req.headers.host}`;
    fetch(`${baseUrl}/api/brevo-subscribe`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        source:         'Free Guide',
        additionalListIds: [3],
        extraAttributes: { HAS_FREE_GUIDE: true, ENTRY_DATE: new Date().toISOString().split('T')[0] },
      }),
    }).catch(err => console.error('Brevo sync (send-guide):', err));

    await resend.emails.send({
      from:    'Margin Labs <hello@marginlabs.io>',
      to:      email,
      subject: 'The Embedded Payments Opportunity — your guide',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#F0EBE4;padding:40px 32px;">
          <p style="font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#C8823C;margin:0 0 32px;">Margin Labs</p>
          <h1 style="font-size:24px;font-weight:300;margin:0 0 16px;letter-spacing:-0.02em;">Here's your guide.</h1>
          <p style="font-size:15px;color:rgba(240,235,228,0.6);line-height:1.75;margin:0 0 24px;">
            The Embedded Payments Opportunity covers the four monetization models, the economics of each, and a framework for evaluating where your platform stands.
          </p>
          <a href="https://marginlabs.io/assets/MarginLabs_Embedded_Payments_Opportunity.pdf"
             style="display:inline-block;background:#C8823C;color:#0d0d0d;font-family:monospace;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:14px 28px;border-radius:2px;text-decoration:none;margin-bottom:32px;">
            Download the Guide →
          </a>
          <p style="font-size:13px;color:rgba(240,235,228,0.45);line-height:1.75;margin:0 0 32px;">
            If you want to go further — run the full <a href="https://marginlabs.io/margin-multiplier.html" style="color:#C8823C;">Margin Multiplier</a> to get a four-model revenue estimate for your specific volume and vertical.
          </p>
          <p style="font-size:11px;color:rgba(240,235,228,0.3);border-top:1px solid rgba(200,130,60,0.1);padding-top:24px;margin:0;line-height:1.7;">
            Margin Labs · marginlabs.io · hello@marginlabs.io<br>
            You received this because you requested the guide at marginlabs.io.
          </p>
        </div>
      `,
    });
    res.status(200).json({ ok: true });
  } catch(err) {
    console.error('send-guide error:', err);
    res.status(500).json({ error: 'Failed to send guide' });
  }
};
