#!/usr/bin/env node
/**
 * Margin Labs — One-time Brevo setup script
 * Creates contact attributes, lists, and email templates.
 *
 * Usage:
 *   BREVO_API_KEY=xkeysib-... node scripts/brevo-setup.js
 *
 * Or if .env is present:
 *   node -e "require('dotenv').config()" scripts/brevo-setup.js
 *
 * Safe to re-run — skips items that already exist.
 */

const API_KEY = process.env.BREVO_API_KEY;
if (!API_KEY) { console.error('Missing BREVO_API_KEY'); process.exit(1); }

const HEADERS = { 'Content-Type': 'application/json', 'api-key': API_KEY };
const BASE    = 'https://api.brevo.com/v3';

async function brevo(method, path, body) {
  const opts = { method, headers: HEADERS };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, ok: res.ok, data };
}

// ── 1. Contact Attributes ───────────────────────────────────────

async function createAttributes() {
  const attrs = [
    { name: 'HAS_FREE_GUIDE', type: 'boolean' },
    { name: 'HAS_MULTIPLIER', type: 'boolean' },
    { name: 'HAS_FRAMEWORK',  type: 'boolean' },
    { name: 'ENTRY_DATE',     type: 'date' },
  ];

  for (const attr of attrs) {
    const { status, data } = await brevo('POST', `/contacts/attributes/normal/${attr.name}`, { type: attr.type });
    if (status === 201) {
      console.log(`  ✓ Created attribute: ${attr.name}`);
    } else if (status === 400 && JSON.stringify(data).includes('already exists')) {
      console.log(`  · Attribute exists: ${attr.name}`);
    } else {
      console.log(`  ✗ Attribute ${attr.name}: ${JSON.stringify(data)}`);
    }
  }
}

// ── 2. Lists ────────────────────────────────────────────────────

async function createLists() {
  const lists = [
    { id: 3, name: 'Free Guide Leads',     folderId: 1 },
    { id: 4, name: 'Multiplier Leads',      folderId: 1 },
    { id: 5, name: 'Advisory Leads',         folderId: 1 },
    { id: 6, name: 'Framework Customers',    folderId: 1 },
  ];

  // Check existing lists first
  const { data: existing } = await brevo('GET', '/contacts/lists?limit=50');
  const existingNames = (existing.lists || []).map(l => l.name);

  for (const list of lists) {
    if (existingNames.includes(list.name)) {
      console.log(`  · List exists: "${list.name}"`);
      continue;
    }
    const { status, data } = await brevo('POST', '/contacts/lists', {
      name: list.name,
      folderId: list.folderId,
    });
    if (status === 201) {
      console.log(`  ✓ Created list: "${list.name}" (ID: ${data.id})`);
    } else {
      console.log(`  ✗ List "${list.name}": ${JSON.stringify(data)}`);
    }
  }
}

// ── 3. Email Templates ──────────────────────────────────────────

function buildEmailHtml(bodyHtml, ctaText, ctaUrl) {
  const ctaBlock = ctaText ? `
    <tr>
      <td style="padding: 0 32px 8px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="left" style="border-radius:4px; background-color:#C8823C;">
              <a href="${ctaUrl}" target="_blank" style="display:inline-block; padding:12px 24px; font-family:'DM Sans', sans-serif; font-size:14px; font-weight:700; color:#111111; text-decoration:none; border-radius:4px;">
                ${ctaText} &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
body { margin: 0; padding: 0; width: 100% !important; }
table { border-collapse: collapse; }
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&display=swap');
:root { color-scheme: light dark; }
@media (prefers-color-scheme: light) {
  .eo { background-color: #f5f5f0 !important; }
  .ec { background-color: #ffffff !important; border-color: #e0e0e0 !important; }
  .et { color: #222222 !important; }
  .ef { color: #999999 !important; }
  .ed { border-color: #e0e0e0 !important; }
}
</style>
</head>
<body class="eo" style="margin:0; padding:0; background-color:#111111; font-family:'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="eo" style="background-color:#111111;">
  <tr><td align="center" style="padding: 40px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" class="ec" style="max-width:560px; width:100%; background-color:#111111; border:1px solid #2a2a2a; border-top:3px solid #C8823C;">
      <tr><td style="padding: 28px 32px 0 32px;">
        <a href="https://marginlabs.io" target="_blank" style="text-decoration:none;">
          <img src="https://marginlabs.io/emails/brand-lockup.png" alt="Margin Labs" width="280" style="display:block; width:280px; max-width:100%; height:auto; border:0;" />
        </a>
      </td></tr>
      <tr><td style="padding: 20px 32px 0 32px;">
        ${bodyHtml}
      </td></tr>
      ${ctaBlock}
      <tr><td style="padding: 8px 32px 28px 32px;">
        <p class="et" style="margin:0; font-family:'DM Sans', sans-serif; font-size:15px; line-height:1.7; color:#d4d4d4;">
          — Chris, Margin Labs
        </p>
      </td></tr>
      <tr><td style="padding: 0 32px;">
        <hr class="ed" style="border:none; border-top:1px solid #2a2a2a; margin:0;">
      </td></tr>
      <tr><td style="padding: 20px 32px 24px 32px;">
        <p class="ef" style="margin:0 0 8px 0; font-family:'DM Mono', 'Courier New', monospace; font-size:11px; line-height:1.6; color:#666666;">
          Margin Labs &middot; Embedded Payments Intelligence
        </p>
        <p style="margin:0; font-family:'DM Mono', 'Courier New', monospace; font-size:11px; line-height:1.6;">
          <a href="{{ unsubscribe }}" class="ef" style="color:#666666; text-decoration:underline;">Unsubscribe</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function P(text) {
  return `<p class="et" style="margin:0 0 16px 0; font-family:'DM Sans',sans-serif; font-size:15px; line-height:1.7; color:#d4d4d4;">${text}</p>`;
}
function B(items) {
  return items.map(i =>
    `<p class="et" style="margin:0 0 8px 0; padding-left:16px; font-family:'DM Sans',sans-serif; font-size:15px; line-height:1.7; color:#d4d4d4;">&middot; ${i}</p>`
  ).join('\n');
}
function HR() {
  return `<hr class="ed" style="border:none; border-top:1px solid #2a2a2a; margin:24px 0;">`;
}
function LABEL(text) {
  return `<p style="margin:0 0 12px 0; font-family:'DM Mono',monospace; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#C8823C;">${text}</p>`;
}

const EMAILS = [
  // ── WF1: Free Guide ──
  {
    name: 'ml-wf1-day2',
    subject: 'A tool that goes deeper than the guide',
    cta: ['Run the Margin Multiplier', 'https://marginlabs.io/margin-multiplier'],
    body: [
      P('Hope you\'ve had a chance to look through the guide.'),
      P('It covers the landscape — the four models, what each one means, and the questions to ask before you start evaluating. It\'s the orientation layer.'),
      P('What it can\'t do is tell you what the numbers look like for <strong style="color:#e5e5e5;">your</strong> platform.'),
      P('That\'s what the Margin Multiplier does. Plug in your payment volume and it runs a side-by-side comparison across all four monetization models — ISV Referral, Enhanced Residuals, PayFac-as-a-Service, and Full PayFac.'),
      P('Takes about 60 seconds.'),
    ],
    postCta: P('The output pairs well with the guide\'s model comparison section. Worth doing them together.'),
  },
  {
    name: 'ml-wf1-day5',
    subject: 'The number most platforms don\'t know',
    cta: ['Run the Margin Multiplier', 'https://marginlabs.io/margin-multiplier'],
    body: [
      P('There\'s one number that determines whether embedded payments is a line item or a business unit for your platform.'),
      P('It\'s your opportunity gap — the delta between what you\'re earning today on payments and what you\'d earn under the optimal model at your volume.'),
      P('Most platforms don\'t know this number. Their processor doesn\'t volunteer it.'),
      P('The Margin Multiplier calculates it in about 60 seconds.'),
    ],
    postCta: P('If the gap is under $50K/year, you\'re probably fine where you are. If it\'s over $200K, that\'s a conversation worth having.'),
  },
  {
    name: 'ml-wf1-day9',
    subject: 'What the guide doesn\'t cover (by design)',
    cta: ['Get the Strategic Framework — $139', 'https://marginlabs.io/strategic-framework'],
    body: [
      P('The free guide gives you the landscape. It does not give you:'),
      B([
        'Real-world take rate economics across all four models (Sections 7-10)',
        'The payments ecosystem map — processors, gateways, acquirers, and where your platform fits (Section 5)',
        'A decision framework for which model fits your stage and volume (Section 11)',
        'How embedded payments affects your enterprise valuation (Section 12)',
        'A 90-day quick-start plan with phase-by-phase milestones (Section 12)',
      ]),
      P('Those gaps are deliberate. The guide is the "should we think about this?" layer. The Strategic Decision Framework is the "how do we evaluate this?" layer.'),
      P('14 sections across three parts: the landscape, the four models in detail, and the action plan.'),
    ],
  },
  {
    name: 'ml-wf1-day14',
    subject: 'One more resource, then I\'ll step back',
    cta: ['Visit The Lab', 'https://marginlabs.io/the-lab'],
    body: [
      P('If embedded payments is on your roadmap — even loosely — the <a href="https://marginlabs.io/strategic-framework" style="color:#C8823C; text-decoration:underline;">Strategic Decision Framework</a> ($139) is the most efficient way to understand the model economics and what execution requires at your stage.'),
      P('If the timing isn\'t right, the Lab has free analysis on the topics that come up most:'),
    ],
    postCta: P('We\'ll only be in touch again when there\'s something genuinely worth your time.'),
  },

  // ── WF2: Multiplier ──
  {
    name: 'ml-wf2-day2',
    subject: 'Your results + a resource that pairs with them',
    cta: ['Download the Free Guide', 'https://marginlabs.io/#free-guide'],
    body: [
      P('Your Margin Multiplier results showed {{ contact.RECOMMENDED_MODEL }} as the highest-margin model at your volume. The opportunity gap — what you\'d gain by moving to that model — was approximately {{ contact.OPPORTUNITY_GAP }}.'),
      P('That\'s a directional estimate. The actual number depends on your merchant mix, vertical, and the terms you negotiate.'),
      P('If you haven\'t seen it yet, the free guide covers the landscape — what each model actually means, the questions to ask, and the common mistakes platforms make early on.'),
    ],
    postCta: P('It pairs well with the Multiplier output. The guide explains the models; the Multiplier shows your specific numbers.'),
  },
  {
    name: 'ml-wf2-day5',
    subject: 'The activation problem nobody talks about',
    cta: ['Read: Why Merchants Don\'t Use Payments', 'https://marginlabs.io/the-lab/why-merchants-dont-use-payments'],
    body: [
      P('Your Multiplier results assume 100% merchant activation. In practice, most platforms see 40-70%.'),
      P('That means the real number is likely lower than the estimate you received — unless you solve the activation problem.'),
      P('A platform with 80% activation on Enhanced Residuals generates more revenue than a platform with 40% activation on PayFac-as-a-Service. The model matters, but activation matters more.'),
      P('This is one of the topics we cover in depth:'),
    ],
    postCta: P('The three reasons merchants don\'t opt in — and what the top-performing platforms do differently.'),
  },
  {
    name: 'ml-wf2-day9',
    subject: 'What the Multiplier doesn\'t show you',
    cta: ['Get the Strategic Framework — $139', 'https://marginlabs.io/strategic-framework'],
    body: [
      P('The Margin Multiplier gives you the headline number — the revenue estimate across all four models at your volume.'),
      P('What it doesn\'t show:'),
      B([
        'The actual take rate ranges and what drives them within each model (Sections 7-10)',
        'How the payments ecosystem works — processors, gateways, where your platform fits (Section 5)',
        'Whether your platform is operationally ready to move up the model stack (Section 11)',
        'How payments revenue affects your enterprise valuation at exit (Section 12)',
        'A 90-day plan to go from decision to first payments revenue (Section 12)',
      ]),
      P('The Multiplier shows you the opportunity exists. The Framework shows you how to evaluate it.'),
    ],
  },
  {
    name: 'ml-wf2-day14',
    subject: 'One more resource, then I\'ll step back',
    cta: ['Visit The Lab', 'https://marginlabs.io/the-lab'],
    body: [
      P('Your Multiplier estimate showed a {{ contact.OPPORTUNITY_GAP }} opportunity gap. If that number warranted attention, the <a href="https://marginlabs.io/strategic-framework" style="color:#C8823C; text-decoration:underline;">Strategic Decision Framework</a> ($139) is the next step — it turns that estimate into an evaluation you can act on.'),
      P('If the timing isn\'t right:'),
    ],
    postCta: P('Free analysis on the topics that matter most. We\'ll only be in touch again when there\'s something worth your time.'),
  },

  // ── WF3: Post-Purchase ──
  {
    name: 'ml-wf3-day3',
    subject: 'Getting the most out of the Framework',
    body: [
      P('Your Framework should have arrived. A few sections worth reading closely.'),
      P('<strong style="color:#e5e5e5;">The Four Models — Sections 7 through 10:</strong> Each model gets its own deep dive with real-world take rate economics, not vendor deck numbers. If a processor is quoting outside these ranges, that\'s useful information for your next conversation.'),
      P('<strong style="color:#e5e5e5;">Which Model Is Right for You — Section 11:</strong> The decision framework based on volume, stage, operational capacity, and strategic timeline. This is where most readers spend the most time. It includes a quick-decision matrix and valuation impact analysis.'),
      P('<strong style="color:#e5e5e5;">The 90-Day Quick Start — Section 12:</strong> Phase-by-phase milestones from decision to first payments revenue. Useful for scoping the internal conversation about resources and timeline.'),
      P('Questions on anything in there? Reply to this email — we read every one.'),
    ],
  },
  {
    name: 'ml-wf3-day7',
    subject: 'The fastest path from framework to decision',
    cta: ['Book a Quick Start Call', 'https://marginlabs.io/advisory'],
    body: [
      P('By now you\'ve worked through at least part of the Framework.'),
      P('Most operators land in one of two places:'),
      P('&nbsp;&nbsp;A) "I know which model makes sense. Now I need to figure out the vendor, the terms, and the implementation plan."'),
      P('&nbsp;&nbsp;B) "I have better questions than when I started, but I\'m not sure how to apply this to my specific situation."'),
      P('Either way — the fastest path forward is a conversation, not more reading.'),
      HR(),
      LABEL('QUICK START CALL — $379'),
      P('One hour. Your specific situation, your numbers, your platform.'),
      B([
        'Which model fits your volume and stage',
        'What realistic economics look like for you specifically',
        'Which vendors to evaluate (and which to skip)',
        'What to ask for in your first processor conversation',
        'Warm introductions to vetted processing partners',
      ]),
      P('Follow-up action plan delivered within 48 hours.'),
      HR(),
    ],
    postCta: P('If you\'d rather execute independently, ask about the Execution Playbook ($697) — vendor scorecards, contract term benchmarks, negotiation playbook, and implementation project plans.'),
  },
  {
    name: 'ml-wf3-day14',
    subject: 'Where does this land for you?',
    cta: ['Book a Quick Start Call — $379', 'https://marginlabs.io/advisory'],
    body: [
      P('Two weeks since you picked up the Framework.'),
      P('The operators we work with usually follow a pattern:'),
      P('&nbsp;&nbsp;Week 1: Read through, run the numbers, identify the model<br>&nbsp;&nbsp;Week 2: Start thinking about vendors and internal buy-in<br>&nbsp;&nbsp;Week 3-4: Either start vendor conversations or realize they need help navigating the specifics'),
      P('If you\'re approaching vendor conversations — or already in them — the Quick Start Call is designed for exactly that moment. One hour, your specific situation, directional recommendations, and introductions to vetted processing partners.'),
    ],
    postCta: P('If you\'re not there yet, no rush. Reply here if anything in the Framework needs clarification.'),
  },
  {
    name: 'ml-wf3-day21',
    subject: 'Two paths forward from the Framework',
    cta: ['Book a Quick Start Call', 'https://marginlabs.io/advisory'],
    body: [
      P('Two paths forward:'),
      LABEL('GUIDED: QUICK START CALL — $379'),
      P('One hour on your specific situation. Model recommendation, vendor shortlist, negotiation guidance, warm introductions to vetted processing partners. Follow-up action plan included.'),
      HR(),
      LABEL('SELF-SERVICE: EXECUTION PLAYBOOK — $697'),
      P('Vendor scorecards, contract benchmarks, negotiation playbook, ROI calculator, implementation project plans, board presentation template. <a href="https://marginlabs.io/advisory" style="color:#C8823C; text-decoration:underline;">Ask about it here.</a>'),
      HR(),
      P('The call is faster and includes introductions. The Playbook is more comprehensive and works on your own timeline.'),
      P('After this, we\'ll only be in touch when we have something genuinely useful to share.'),
    ],
  },

  // ── WF4: Advisory ──
  {
    name: 'ml-wf4-immediate',
    subject: 'We\'ve received your inquiry',
    cta: ['Run the Margin Multiplier', 'https://marginlabs.io/margin-multiplier'],
    body: [
      P('Thanks for reaching out. We\'ve received your information and will follow up within 48 hours.'),
      P('In the meantime — if you haven\'t run the Margin Multiplier, it will give us a cleaner starting point for the conversation:'),
    ],
  },
  {
    name: 'ml-wf4-day3',
    subject: 'Following up on your inquiry',
    body: [
      P('Following up on your inquiry from a few days ago. I want to make sure my response didn\'t land in spam — I\'ll be reaching out directly shortly.'),
      P('If anything has changed or you\'d like to add context before we connect, reply here.'),
    ],
  },
];

async function createTemplates() {
  // Check existing templates
  const { data: existing } = await brevo('GET', '/smtp/templates?limit=100');
  const existingNames = (existing.templates || []).map(t => t.name);

  for (const email of EMAILS) {
    if (existingNames.includes(email.name)) {
      console.log(`  · Template exists: ${email.name}`);
      continue;
    }

    const bodyHtml = [
      ...(email.body || []),
      email.postCta || '',
    ].join('\n');

    const fullHtml = buildEmailHtml(
      bodyHtml,
      email.cta ? email.cta[0] : null,
      email.cta ? email.cta[1] : null,
    );

    const { status, data } = await brevo('POST', '/smtp/templates', {
      templateName: email.name,
      subject: email.subject,
      sender: { name: 'Chris, Margin Labs', email: 'chris@marginlabs.io' },
      htmlContent: fullHtml,
      isActive: true,
    });

    if (status === 201) {
      console.log(`  ✓ Created template: ${email.name} (ID: ${data.id})`);
    } else {
      console.log(`  ✗ Template ${email.name}: ${JSON.stringify(data)}`);
    }
  }
}

// ── Run ─────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══ Margin Labs — Brevo Setup ═══\n');

  console.log('1. Contact attributes...');
  await createAttributes();

  console.log('\n2. Lists...');
  await createLists();

  console.log('\n3. Email templates (14 emails)...');
  await createTemplates();

  console.log('\n═══ Done ═══\n');
  console.log('Next: Configure 4 automation workflows in Brevo dashboard.');
  console.log('See Brevo_Marketing_Automation_Plan_v2.docx for step-by-step instructions.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
