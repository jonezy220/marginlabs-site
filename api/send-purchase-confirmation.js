const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    await resend.emails.send({
      from:    'Margin Labs <hello@marginlabs.io>',
      to:      email,
      subject: 'Your Embedded Payments Primer — order confirmed',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#F0EBE4;padding:40px 32px;">
          <p style="font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#C8823C;margin:0 0 32px;">Margin Labs</p>
          <h1 style="font-size:24px;font-weight:300;margin:0 0 16px;">You're in.</h1>
          <p style="font-size:15px;color:rgba(240,235,228,0.6);line-height:1.75;margin:0 0 24px;">
            Your order is confirmed. Your copy of the Embedded Payments Primer will be delivered to this email within 72 hours.
          </p>
          <p style="font-size:14px;color:rgba(240,235,228,0.5);line-height:1.7;margin:0 0 32px;">
            Questions? Reply to this email or reach out at hello@marginlabs.io.
          </p>
          <p style="font-size:11px;color:rgba(240,235,228,0.3);border-top:1px solid rgba(200,130,60,0.1);padding-top:24px;margin:0;">
            Margin Labs · marginlabs.io
          </p>
        </div>
      `,
    });
    res.status(200).json({ ok: true });
  } catch(err) {
    res.status(500).json({ error: 'Failed to send purchase confirmation' });
  }
};
