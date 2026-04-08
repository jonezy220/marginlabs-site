const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const PRODUCT_NAMES = {
  tier1: 'The Embedded Payments Strategic Decision Framework',
  tier2: 'The Embedded Payments Execution Playbook',
};

async function sendDeliveryEmail(email, product, downloadUrl) {
  const productName = PRODUCT_NAMES[product] || PRODUCT_NAMES.tier1;
  const shortName   = productName.split(' ').slice(0, 4).join(' ');

  await resend.emails.send({
    from:    'Margin Labs <hello@marginlabs.io>',
    replyTo: 'hello@marginlabs.io',
    to:      email,
    subject: 'Your Margin Labs purchase — download link inside',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#111111;font-family:'DM Sans',Arial,sans-serif;color:#F0EBE4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:4px;border:1px solid rgba(200,130,60,0.15);padding:48px 40px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#C8823C;font-family:'DM Mono',monospace;">Margin Labs</p>
          <h1 style="margin:0 0 24px;font-size:22px;font-weight:600;color:#F0EBE4;line-height:1.3;">Thank you for your purchase.</h1>
          <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:rgba(240,235,228,0.72);">${productName} is ready to download.</p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td style="background:#C8823C;border-radius:2px;">
              <a href="${downloadUrl}" style="display:inline-block;padding:14px 28px;font-family:'DM Mono',monospace;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#0d0d0d;text-decoration:none;">Download ${shortName} &#8594;</a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:rgba(240,235,228,0.45);">This link is active for 72 hours. If it expires, you can request a new one at:</p>
          <p style="margin:0 0 32px;font-size:13px;"><a href="https://marginlabs.io/download-expired" style="color:#C8823C;text-decoration:none;">marginlabs.io/download-expired</a></p>
          <p style="margin:0;font-size:13px;color:rgba(240,235,228,0.35);">Questions? <a href="mailto:hello@marginlabs.io" style="color:rgba(240,235,228,0.45);text-decoration:none;">hello@marginlabs.io</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

module.exports = { sendDeliveryEmail };
