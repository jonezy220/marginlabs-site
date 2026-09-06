const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, volLabel, curLabel, recModel, gapAmt, modelSummary, arrLabel, vertLabel, rationale } = req.body;
  if (!email || !volLabel) return res.status(400).json({ error: 'Missing required fields' });

  try {
    await resend.emails.send({
      from:    'Margin Labs <hello@marginlabs.io>',
      to:      email,
      subject: `Your Margin Multiplier — ${volLabel} in payments volume`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#F0EBE4;padding:40px 32px;">
          <img src="https://marginlabs.io/emails/brand-lockup.png" alt="Margin Labs" width="200" style="width:200px;max-width:62%;height:auto;display:block;margin:0 0 28px;">
          <p style="font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#C8823C;margin:0 0 32px;">The Margin Multiplier™</p>
          <h1 style="font-size:24px;font-weight:300;margin:0 0 8px;letter-spacing:-0.02em;">Your payments opportunity estimate</h1>
          <p style="font-size:14px;color:rgba(240,235,228,0.55);margin:0 0 32px;line-height:1.7;">
            Based on ${volLabel} in annual payments volume · ${curLabel} current model · ${vertLabel || 'your vertical'}
          </p>
          <div style="background:#111;border-left:3px solid #C8823C;padding:20px 24px;margin-bottom:24px;">
            <p style="font-family:monospace;font-size:8px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(240,235,228,0.35);margin:0 0 6px;">Annual opportunity</p>
            <p style="font-size:32px;font-weight:700;color:#C8823C;margin:0 0 4px;">${gapAmt}</p>
            <p style="font-size:12px;color:rgba(240,235,228,0.45);margin:0;">potential annual uplift moving to ${recModel}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
            <tr style="border-bottom:1px solid rgba(200,130,60,0.1);">
              <td style="font-family:monospace;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(240,235,228,0.35);padding:8px 0;">Model</td>
              <td style="font-family:monospace;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(240,235,228,0.35);padding:8px 0;text-align:right;">Est. Annual</td>
            </tr>
            ${(modelSummary || '').split(' | ').map(row => {
              const parts = row.split(':');
              const name = (parts[0] || '').trim();
              const val  = (parts[1] || '').trim();
              const isRec = name.toLowerCase().includes((recModel || '').toLowerCase());
              return `<tr style="border-bottom:1px solid rgba(200,130,60,0.07);">
                <td style="font-size:13px;font-weight:${isRec?'400':'300'};color:${isRec?'#F0EBE4':'rgba(240,235,228,0.6)'};padding:10px 0;">${name}${isRec?' ★':''}</td>
                <td style="font-size:13px;font-weight:${isRec?'700':'300'};color:${isRec?'#C8823C':'rgba(240,235,228,0.6)'};padding:10px 0;text-align:right;">${val.split('/')[0]}</td>
              </tr>`;
            }).join('')}
          </table>
          ${rationale ? `<div style="background:#111;border:1px solid rgba(200,130,60,0.10);border-radius:4px;padding:20px 24px;margin-bottom:16px;">
            <p style="font-family:monospace;font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:#C8823C;margin:0 0 8px;">Why ${recModel || 'this model'}</p>
            <p style="font-size:13px;color:rgba(240,235,228,0.72);line-height:1.7;margin:0;">${rationale}</p>
          </div>` : ''}
          <div style="background:#111;border:1px solid rgba(200,130,60,0.14);border-radius:4px;padding:24px;margin-bottom:16px;">
            <p style="font-family:monospace;font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:#C8823C;margin:0 0 8px;">Your free Guide</p>
            <p style="font-size:16px;font-weight:300;margin:0 0 8px;">The Embedded Payments Guide</p>
            <p style="font-size:13px;color:rgba(240,235,228,0.55);line-height:1.65;margin:0 0 16px;">A vendor-neutral PDF on the four monetization models, processor economics and the operational considerations for each path. Save it for reference.</p>
            <a href="https://marginlabs.io/assets/MarginLabs_Embedded_Payments_Opportunity.pdf"
               style="display:inline-block;background:#C8823C;color:#0d0d0d;font-family:monospace;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:11px 22px;border-radius:2px;text-decoration:none;">
              Download the Guide →
            </a>
          </div>
          <div style="background:#111;border:1px solid rgba(200,130,60,0.10);border-radius:4px;padding:20px 24px;margin-bottom:24px;">
            <p style="font-family:monospace;font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(240,235,228,0.45);margin:0 0 8px;">Next step</p>
            <p style="font-size:13px;color:rgba(240,235,228,0.6);line-height:1.65;margin:0;">
              If the opportunity gap is meaningful, the <a href="https://marginlabs.io/" style="color:#C8823C;text-decoration:none;border-bottom:1px solid rgba(200,130,60,0.3);">Strategic Decision Framework ($139)</a> takes you from question to decision. If you want a focused working session with model confirmation and warm processor intros, the <a href="https://marginlabs.io/advisory" style="color:#C8823C;text-decoration:none;border-bottom:1px solid rgba(200,130,60,0.3);">Quick Start Call ($379)</a> is the right next move. Reply to this email if you're not sure which fits.
            </p>
          </div>
          <p style="font-size:11px;color:rgba(240,235,228,0.3);line-height:1.7;margin:0;border-top:1px solid rgba(200,130,60,0.1);padding-top:24px;">
            Margin Labs · marginlabs.io · hello@marginlabs.io<br>
            You received this because you ran the Margin Multiplier at marginlabs.io.
          </p>
        </div>
      `,
    });
    res.status(200).json({ ok: true });
  } catch(err) {
    console.error('Resend confirmation error:', err);
    res.status(500).json({ error: 'Failed to send confirmation' });
  }
};
