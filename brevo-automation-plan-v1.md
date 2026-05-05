# Margin Labs — Brevo Marketing Automation Plan
**Version 1.0 · April 2026 · Based on Business Plan v8**

All automation runs in Brevo. Resend handles transactional emails only (purchase confirmations, PDF delivery). Everything below is configured as Brevo Automation Workflows.

---

## Funnel Overview

```
                        ┌──────────────────┐
                        │   PAID / ORGANIC  │
                        │     TRAFFIC       │
                        └────────┬─────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                   │
     ┌────────▼───────┐ ┌───────▼────────┐ ┌───────▼────────┐
     │  FREE GUIDE    │ │    MARGIN      │ │   ADVISORY     │
     │  Download      │ │  MULTIPLIER    │ │   Form         │
     │  (email gate)  │ │  (email gate)  │ │   (consult)    │
     └────────┬───────┘ └───────┬────────┘ └───────┬────────┘
              │                  │                   │
              │    WORKFLOW 1    │    WORKFLOW 2      │  WORKFLOW 4
              │  Free Guide     │  Multiplier        │  Advisory
              │  Nurture        │  Nurture           │  Confirmation
              │  (4 emails)     │  (4 emails)        │  (2 emails)
              │                  │                   │
              │  Cross-sell:     │  Cross-sell:       │
              │  "Run the        │  "Download the     │
              │   Multiplier"    │   Free Guide"      │
              │                  │                   │
              └────────┬─────────┘                   │
                       │                             │
                       ▼                             │
              ┌────────────────┐                     │
              │  $139 PURCHASE │◄────────────────────┘
              │  (Framework)   │  (some advisory leads
              └────────┬───────┘   buy on their own)
                       │
                       │  WORKFLOW 3
                       │  Post-Purchase
                       │  (4 emails)
                       │
                       ▼
              ┌────────────────┐
              │  $379 QUICK    │  ← Primary CTA
              │  START CALL    │
              └────────────────┘
                      or
              ┌────────────────┐
              │  $697 PLAYBOOK │  ← Secondary (DIY)
              └────────────────┘
```

---

## Brevo Contact Attributes

These track state across workflows. Configure in Brevo → Contacts → Settings → Contact Attributes.

| Attribute | Type | Values | Purpose |
|-----------|------|--------|---------|
| `SOURCE` | Text | `Free Guide`, `Margin Multiplier`, `Advisory Form`, `Framework Customer` | Already exists. Set by API on entry |
| `HAS_FREE_GUIDE` | Boolean | true/false | Tracks whether contact has the free guide |
| `HAS_MULTIPLIER` | Boolean | true/false | Tracks whether contact ran the calculator |
| `HAS_FRAMEWORK` | Boolean | true/false | Set true on $139 purchase |
| `ENTRY_DATE` | Date | Auto | When contact first entered the system |

**Existing attributes to keep:** `PAYMENTS_VOLUME`, `CURRENT_MODEL`, `RECOMMENDED_MODEL`, `OPPORTUNITY_GAP`, `NEXT_STEP`

---

## Brevo Tags (for suppression & workflow triggers)

| Tag | Applied by | Purpose |
|-----|-----------|---------|
| `free-guide-lead` | `api/send-guide.js` | Entered via free guide download |
| `multiplier-lead` | `api/submit-calculator.js` | Entered via Margin Multiplier |
| `advisory-lead` | `api/submit-consult.js` | Submitted advisory/consult form |
| `framework-customer` | `api/stripe-webhook.js` | Purchased $139 Framework |
| `playbook-customer` | `api/stripe-webhook.js` (future) | Purchased $697 Playbook |
| `call-booked` | Manual | Booked Quick Start Call |

---

## WORKFLOW 1: Free Guide Nurture

**Trigger:** Tag `free-guide-lead` added
**Suppression:** Skip if tag `framework-customer` exists
**Goal:** Drive Margin Multiplier usage → Framework purchase

---

### Email 1.1 — Day 2: "A tool that goes deeper than the guide"

```
FROM:    chris@marginlabs.io
SUBJECT: A tool that goes deeper than the guide

MARGIN LABS

Hope you've had a chance to look through the guide.

It covers the landscape — the four models, what each one means,
and the questions to ask before you start evaluating. It's the
orientation layer.

What it can't do is tell you what the numbers look like for
YOUR platform.

That's what the Margin Multiplier does. You plug in your payment
volume and it runs a side-by-side comparison across all four
monetization models — ISV Referral, Enhanced Residuals, PayFac-
as-a-Service, and Full PayFac.

Takes about 60 seconds:
→ marginlabs.io/margin-multiplier

The output pairs well with Section 2 of the guide (the model
comparison). Worth doing them together.

— Chris, Margin Labs
```

**Brevo condition after send:** If `HAS_MULTIPLIER` = true, skip Email 1.2 and go to 1.3.

---

### Email 1.2 — Day 5: "The number most platforms don't know"

```
FROM:    chris@marginlabs.io
SUBJECT: The number most platforms don't know

MARGIN LABS

There's one number that determines whether embedded payments
is a line item or a business unit for your platform.

It's your opportunity gap — the delta between what you're
earning today on payments and what you'd earn under the
optimal model at your volume.

Most platforms don't know this number. Their processor doesn't
volunteer it.

The Margin Multiplier calculates it in about 60 seconds.

→ marginlabs.io/margin-multiplier

If the gap is under $50K/year, you're probably fine where you
are. If it's over $200K, the conversation gets interesting.

— Chris
```

---

### Email 1.3 — Day 9: "What the guide doesn't cover (deliberately)"

```
FROM:    chris@marginlabs.io
SUBJECT: What the guide doesn't cover (deliberately)

MARGIN LABS

The free guide gives you the landscape. It doesn't give you:

  · The actual take rate economics at your volume level
  · Which vendors lead in each model category
  · How to assess your platform's readiness for each model
  · A methodology for building a business case internally
  · An implementation roadmap with phase-by-phase milestones

Those gaps are deliberate. The guide is the "should we think
about this?" layer. The Strategic Framework is the "how do
we think about this?" layer.

45 pages. Covers model economics, vendor landscape, readiness
assessment, ROI methodology, and implementation planning.

→ marginlabs.io/strategic-framework ($139)

— Chris
```

---

### Email 1.4 — Day 14: "Last note from me on this"

```
FROM:    chris@marginlabs.io
SUBJECT: Last note from me on this

MARGIN LABS

Final email in this sequence.

If embedded payments is on your roadmap — even loosely — the
Strategic Framework ($139) is the most efficient way to get
a real picture of the economics and what it takes.

If the timing isn't right, no problem. The Lab has free
articles on the topics that come up most:

→ marginlabs.io/the-lab

I'll only reach out again when there's something worth sending.

— Chris
```

**End of workflow.** Contact stays in Brevo list for future broadcasts.

---

## WORKFLOW 2: Margin Multiplier Nurture

**Trigger:** Tag `multiplier-lead` added
**Suppression:** Skip if tag `framework-customer` exists. Skip if already in Workflow 1 (merge logic below).
**Goal:** Deliver free guide (if they don't have it) → Framework purchase

**Merge rule:** If a contact has BOTH `free-guide-lead` and `multiplier-lead`, they follow Workflow 2 (Multiplier) only. The Multiplier results are more personalized and create a stronger hook. Workflow 1 exits via suppression.

---

### Email 2.1 — Day 2: "Your results + a resource that pairs with them"

```
FROM:    chris@marginlabs.io
SUBJECT: Your results + a resource that pairs with them

MARGIN LABS

A couple of days since you ran the Margin Multiplier.

Your results showed {{RECOMMENDED_MODEL}} as the highest-margin
model at your volume. The opportunity gap — what you'd gain
by moving to that model — was approximately {{OPPORTUNITY_GAP}}.

That's a directional estimate. The actual number depends on your
merchant mix, vertical, and the terms you negotiate.

If you haven't grabbed it yet, the free guide gives you the
landscape view — what each model actually means, the questions
to ask, and the common mistakes platforms make early on.

→ Download the free guide: marginlabs.io
  (scroll to "Get the Free Guide" — just your email)

It pairs well with the Multiplier output. The guide explains
the models; the Multiplier shows your specific numbers.

— Chris
```

**Brevo condition:** If `HAS_FREE_GUIDE` = true, replace body with version that skips the guide offer and instead links to a Lab article ("Why Merchants Don't Use Payments").

---

### Email 2.2 — Day 5: "The activation problem nobody talks about"

```
FROM:    chris@marginlabs.io
SUBJECT: The activation problem nobody talks about

MARGIN LABS

Your Multiplier results assume 100% merchant activation.
In practice, most platforms see 40-70%.

That means the real number is probably lower than the estimate
you saw — unless you solve the activation problem.

A platform with 80% activation on Enhanced Residuals generates
more revenue than a platform with 40% activation on PayFac-
as-a-Service. The model matters, but activation matters more.

More on this: marginlabs.io/the-lab/why-merchants-dont-use-payments

That article covers the three reasons merchants don't opt in
and what the top-performing platforms do differently.

— Chris
```

---

### Email 2.3 — Day 9: "What the Multiplier doesn't show you"

```
FROM:    chris@marginlabs.io
SUBJECT: What the Multiplier doesn't show you

MARGIN LABS

The Margin Multiplier gives you the headline number — the
revenue estimate across all four models at your volume.

What it doesn't show:

  · Why the take rate ranges vary so much within each model
  · Which vendors are strongest at your volume tier
  · What it actually costs to implement each model
  · Whether your platform is ready (technically and operationally)
  · How to build a business case that survives a board meeting

That's what the Strategic Framework covers. 45 pages.
Model economics, vendor landscape, readiness assessment,
ROI methodology, and implementation planning.

The Multiplier shows you the opportunity exists. The Framework
shows you how to capture it.

→ marginlabs.io/strategic-framework ($139)

— Chris
```

---

### Email 2.4 — Day 14: "Last note on this"

```
FROM:    chris@marginlabs.io
SUBJECT: Last note on this

MARGIN LABS

Final email in this sequence.

Your Multiplier estimate showed a {{OPPORTUNITY_GAP}} opportunity
gap. If that number got your attention, the Strategic Framework
($139) is the next step — it turns that estimate into a plan
you can act on.

If the timing isn't right: marginlabs.io/the-lab has free
content on the topics that matter most.

I'll only reach out again when there's something worth sending.

— Chris
```

**End of workflow.**

---

## WORKFLOW 3: Post-Purchase Nurture (Framework $139)

**Trigger:** Tag `framework-customer` added
**Suppression:** Immediately remove contact from Workflows 1 and 2
**Goal:** Drive Quick Start Call ($379) booking. Playbook ($697) as secondary DIY option.

---

### Email 3.1 — Day 3: "Getting the most out of the Framework"

```
FROM:    chris@marginlabs.io
SUBJECT: Getting the most out of the Framework

MARGIN LABS

Your Framework should have arrived. A few things worth
reading closely.

Section 2 (Model Economics): The take rate ranges are
real-world benchmarks, not theoretical. If your processor
is quoting outside those ranges, that's useful information
for your next conversation.

Section 4 (Readiness Assessment): This is the section most
operators skip and then wish they hadn't. The model decision
is only as good as your platform's ability to execute it.

Section 5 (ROI Methodology): Use this to build your own
projection with your own numbers. The Multiplier gave you
a directional estimate — this section shows you how to
make it defensible.

Questions on anything in there? Reply to this email.
I read every one.

— Chris, Margin Labs
```

---

### Email 3.2 — Day 7: "The fastest way to go from framework to decision"

```
FROM:    chris@marginlabs.io
SUBJECT: The fastest way to go from framework to decision

MARGIN LABS

By now you've worked through at least part of the Framework.

Most operators land in one of two places:

  A) "I know which model makes sense. Now I need to figure
      out the vendor, the terms, and the implementation plan."

  B) "I have better questions than when I started, but I'm
      not sure how to apply this to my specific situation."

Either way — the fastest path forward is a conversation,
not more reading.

────────────────────────────────────────
QUICK START CALL — $379

One hour. Your specific situation, your numbers, your
platform. We'll cover:

  · Which model fits your volume and stage
  · What realistic economics look like for you specifically
  · Which vendors to talk to (and which to skip)
  · What to ask for in your first processor conversation
  · Warm introductions to vetted processing partners

You'll get a follow-up email with specific action items
and next steps within 48 hours.

→ marginlabs.io/advisory
────────────────────────────────────────

If you'd rather go the DIY route, the Execution Playbook
($697) has vendor scorecards, contract term benchmarks,
negotiation playbook, and implementation project plans.

→ marginlabs.io/execution-playbook

The call gets you to a decision faster. The Playbook gets
you there on your own timeline.

— Chris
```

---

### Email 3.3 — Day 14: "Where does this land for you?"

```
FROM:    chris@marginlabs.io
SUBJECT: Where does this land for you?

MARGIN LABS

Two weeks since you picked up the Framework.

Curious where things stand. The operators I work with
usually fall into a pattern:

  Week 1: Read through, run the numbers, identify the model
  Week 2: Start thinking about vendors and internal buy-in
  Week 3-4: Either start vendor conversations or realize
            they need help navigating the specifics

If you're at the vendor conversation stage — or heading
there — the Quick Start Call is designed for exactly that
moment. One hour, your situation, specific recommendations
and introductions.

→ marginlabs.io/advisory ($379)

If you're not there yet, no pressure. Reply here if
anything in the Framework needs clarification.

— Chris
```

---

### Email 3.4 — Day 21: "One last thought"

```
FROM:    chris@marginlabs.io
SUBJECT: One last thought

MARGIN LABS

Last note from me.

Two paths forward from the Framework:

  GUIDED: Quick Start Call ($379)
  One hour on your specific situation. Model recommendation,
  vendor shortlist, negotiation guidance, warm intros to
  vetted processing partners. Follow-up action plan included.
  → marginlabs.io/advisory

  DIY: Execution Playbook ($697)
  Vendor scorecards, contract benchmarks, negotiation
  playbook, ROI calculator, implementation project plans,
  board presentation template. Everything you need to
  execute independently.
  → marginlabs.io/execution-playbook

Either path works. The call is faster and includes
introductions. The Playbook is more comprehensive and
works on your own timeline.

After this, I'll only be in touch when I have something
genuinely useful to send.

— Chris
```

**End of workflow.**

---

## WORKFLOW 4: Advisory Confirmation

**Trigger:** Tag `advisory-lead` added
**Suppression:** None (advisory leads can also be in product workflows)
**Goal:** Confirm receipt. One follow-up. That's it — Chris handles manually from here.

---

### Email 4.1 — Immediate: "We have your inquiry"

```
FROM:    chris@marginlabs.io
SUBJECT: Got your inquiry — we'll be in touch

MARGIN LABS

Thanks for reaching out. We've received your information
and will follow up within 48 hours.

In the meantime — if you haven't run the Margin Multiplier,
it'll give us a cleaner starting point for the conversation:

→ marginlabs.io/margin-multiplier

— Chris, Margin Labs
```

---

### Email 4.2 — Day 3: "Quick follow-up"

**Brevo condition:** Only send if Chris has NOT manually emailed this contact. (In practice: send always — if Chris already replied, the contact will ignore it. Low risk.)

```
FROM:    chris@marginlabs.io
SUBJECT: Quick follow-up on your inquiry

MARGIN LABS

Following up on your inquiry from a few days ago.
I want to make sure my response didn't land in spam —
I'll be reaching out directly shortly.

If anything has changed or you want to add context
before we connect, reply here.

— Chris
```

**End of workflow.** Everything after this is manual.

---

## Suppression & Conflict Rules

| Event | Action |
|-------|--------|
| Contact enters Workflow 1 AND already has `multiplier-lead` tag | Skip Workflow 1; they're in Workflow 2 |
| Contact enters Workflow 2 AND already has `free-guide-lead` tag | Exit Workflow 1 immediately |
| Contact gets `framework-customer` tag | Exit Workflows 1 and 2 immediately; enter Workflow 3 |
| Contact gets `playbook-customer` tag | Exit Workflow 3 immediately |
| Contact gets `call-booked` tag | Exit Workflow 3 immediately |
| Contact unsubscribes | Exit all workflows (Brevo handles natively) |

---

## Implementation Checklist

### Brevo Configuration
- [ ] Add contact attributes: `HAS_FREE_GUIDE`, `HAS_MULTIPLIER`, `HAS_FRAMEWORK`, `ENTRY_DATE`
- [ ] Create Workflow 1 (Free Guide Nurture) — 4 emails, Days 2/5/9/14
- [ ] Create Workflow 2 (Multiplier Nurture) — 4 emails, Days 2/5/9/14
- [ ] Create Workflow 3 (Post-Purchase) — 4 emails, Days 3/7/14/21
- [ ] Create Workflow 4 (Advisory Confirmation) — 2 emails, Immediate/Day 3
- [ ] Configure suppression rules between workflows
- [ ] Test with chris@marginlabs.io through each entry point

### API Updates (to feed Brevo correctly)
- [ ] `api/send-guide.js` — add tag `free-guide-lead`, set `HAS_FREE_GUIDE` = true
- [ ] `api/submit-calculator.js` — add tag `multiplier-lead`, set `HAS_MULTIPLIER` = true
- [ ] `api/submit-consult.js` — add tag `advisory-lead`
- [ ] `api/stripe-webhook.js` — add tag `framework-customer`, set `HAS_FRAMEWORK` = true, set `SOURCE` = `Framework Customer`
- [ ] Verify `OPPORTUNITY_GAP` and `RECOMMENDED_MODEL` are being passed to Brevo on calculator submit (already wired in `brevo-subscribe.js`)

### Email Template Design
- [ ] Build Brevo email template matching site aesthetic (dark background #111111, copper #C8823C accents, DM Sans/DM Mono, no images, text-first)
- [ ] Create 14 emails total using the template (4 + 4 + 4 + 2)

---

## Sequence Timing Summary

| Workflow | Email | Day | Subject | CTA |
|----------|-------|-----|---------|-----|
| 1 Free Guide | 1.1 | 2 | A tool that goes deeper than the guide | Run Multiplier |
| 1 Free Guide | 1.2 | 5 | The number most platforms don't know | Run Multiplier |
| 1 Free Guide | 1.3 | 9 | What the guide doesn't cover (deliberately) | Buy Framework $139 |
| 1 Free Guide | 1.4 | 14 | Last note from me on this | Buy Framework $139 |
| 2 Multiplier | 2.1 | 2 | Your results + a resource that pairs with them | Get Free Guide |
| 2 Multiplier | 2.2 | 5 | The activation problem nobody talks about | Lab article |
| 2 Multiplier | 2.3 | 9 | What the Multiplier doesn't show you | Buy Framework $139 |
| 2 Multiplier | 2.4 | 14 | Last note on this | Buy Framework $139 |
| 3 Post-Purchase | 3.1 | 3 | Getting the most out of the Framework | Engage with product |
| 3 Post-Purchase | 3.2 | 7 | The fastest way to go from framework to decision | Book QSC $379 |
| 3 Post-Purchase | 3.3 | 14 | Where does this land for you? | Book QSC $379 |
| 3 Post-Purchase | 3.4 | 21 | One last thought | QSC $379 / Playbook $697 |
| 4 Advisory | 4.1 | 0 | Got your inquiry — we'll be in touch | Run Multiplier |
| 4 Advisory | 4.2 | 3 | Quick follow-up on your inquiry | Reply |

---

## What This Replaces

This plan supersedes:
- `brevo-sequences.md` (5 sequences, less structured, partially overlapping)
- `email-waterfalls-plan.md` (6 waterfalls, based on v5 pricing, proposed Resend+Postgres stack)

Both older docs can be archived once this plan is approved and built.

---

## Future Enhancements (not in v1)

- Volume-based segmentation (High-Value / Mid-Market / Early-Stage tracks)
- Progressive profiling survey (Day 1 email with segment self-selection)
- Post-Playbook purchase sequence (→ Quick Start Call upsell)
- Post-Quick Start Call follow-up (Day 30 check-in)
- Quarterly re-engagement for dormant leads
- A/B testing subject lines in Brevo
