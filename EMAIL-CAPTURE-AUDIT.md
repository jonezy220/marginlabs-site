# Email Capture Audit — marginlabs.io (2026-09-04)

Audited the live site, API handlers and Brevo wiring after the analytics kept showing ~250 visitors/mo, 96% new, ~7 returning, funnel reverting to ~11%, with no visible list growth. Headline: **capture is largely BUILT and the code is correct. The problem is almost certainly config/trigger breaks plus a structural coverage gap, not a missing build.**

## What is built and live (the good news)

1. **Margin Multiplier — HARD email gate, the strongest capture point.** `margin-multiplier.html` step 2 requires email (`#gate-email`, required) to see results. On submit → `/api/submit-calculator`, which does three things: Formspree notify to hello@marginlabs.io, Resend a confirmation email to the visitor with the free-guide PDF inline, and Brevo `additionalListIds:[4]` (Multiplier Leads) with rich attributes (HAS_MULTIPLIER, HAS_FREE_GUIDE, PAYMENTS_VOLUME, RECOMMENDED_MODEL, OPPORTUNITY_GAP, UTM). This is a complete, well-built capture on the most valuable asset.
2. **Advisory page** — `advisory.html` consult form (`#adv-email`) → `/api/submit-consult` + `/api/brevo-subscribe`. Captures high-intent consult inquiries.
3. **Homepage free-guide form** — `#guideForm` (index.html), handled in `main.js`: Formspree notify → `/api/send-guide` (Resend the PDF) → `/api/brevo-subscribe` (source "Free Guide Lead") → ML visitor state + Brevo browsing-history identify.
4. **Lab articles — DO have capture (JS-injected, corrected 9/4).** `main.js` injects a "Get new breakdowns like this" subscribe block after `.article-wrap` on every Lab article (not the index). Email → `/api/brevo-subscribe` with `additionalListIds:[12]` ("Lab Subscribers"), SOURCE "Lab Subscriber", LAB_ARTICLE=slug, UTM; fires GA4 `generate_lead`. This is rendered client-side, so a static-HTML grep or curl misses it entirely (the original audit wrongly reported "zero capture on Lab articles"). This is the broadest capture surface and it is correctly listed. (Minor: the code comment says "list 2" but the code uses list 12 — stale comment, code is authoritative.)
5. **Backend wiring is real:** `brevo-subscribe.js` posts to the live Brevo API (`api.brevo.com/v3/contacts`, `BREVO_API_KEY`, updateEnabled). Resend for delivery, Formspree for notify. Silent-fail on CRM errors so the user is never blocked.

## What is broken or missing (why there is no growing, nurtured list)

1. **~~verify BREVO_API_KEY~~ — RESOLVED 9/4. Chris live-tested a capture and it landed in Brevo,** so the key is set and the pipe works end to end. The make-or-break question is closed: capture is functioning, contacts are being created.
2. **Sequence trigger MISMATCH (likely break).** `brevo-sequences.md` documents the Multiplier nurture as "Trigger: Contact added to **list 2**." But `brevo-subscribe.js` notes list 2 was hardcoded, did not exist, and was REMOVED, and `submit-calculator.js` now adds Multiplier leads to **list 4**. If the Brevo automation still watches list 2, Multiplier leads land on list 4 and NEVER enter the nurture. Verify the automation triggers on list 4.
3. **Free-guide leads land LISTLESS.** The `main.js` free-guide `brevo-subscribe` call passes NO `additionalListIds`, and `brevo-subscribe.js` only adds to caller-provided lists. So homepage free-guide signups create a Brevo contact on NO list, which means the list-triggered Free Guide nurture can't fire on them. One-line fix: pass the Free Guide list ID in that call.
4. **~~Lab articles have zero capture~~ — WRONG, retracted.** They have the JS-injected list-12 capture (see "what is built" #4). The Lab is NOT a dead end.
5. **Low absolute volume + opt-in conversion, not a missing surface.** Capture now exists on the Multiplier (list 4), every Lab article (list 12), and advisory. The ceiling is traffic and opt-in rate: ~250 visitors/mo, and a bottom-of-article opt-in block typically converts 0.5-2%, so even fully working this is a handful of contacts/month until traffic grows. Optimizing placement/offer is a real lever, but the surfaces exist.

## Shortest path (priority order)

1. **GROUND TRUTH FIRST — check the Brevo dashboard (5 min, decisive):** how many contacts are on **list 4 (Multiplier)** and **list 12 (Lab Subscribers)**, and how many were added in the last 30 days? This single check tells you whether capture is working at all. Near-zero despite Multiplier completions and Lab traffic = a config break (item 2). Real, growing numbers = capture works and the issue is just scale.
2. **Verify config (make-or-break):** confirm `BREVO_API_KEY` is set in Vercel prod (if missing, every subscribe silently fails); confirm the nurture automations are ON and triggered on the ACTUAL lists the code uses (4 and 12), not the "list 2" the old docs reference.
3. **Fix the listless free-guide bug (one-line code):** add the Free Guide list ID to the `main.js` free-guide brevo-subscribe call once the list is confirmed. (Only affects homepage free-guide leads; Multiplier and Lab captures are correctly listed.)
4. **Then optimize for volume/conversion, not new surfaces:** the surfaces exist. Levers are more traffic to them and better opt-in rate (offer, placement, maybe surfacing the Lab block higher or on scroll). Not a rebuild.

## Note on "7 returning"
"Returning users" in GA4 = people who re-visit the SITE, not email subscribers (subscribers are engaged off-site via email). So low returning does not by itself prove capture is broken. The real proof will be in Brevo: check the actual contact count and recent additions on lists 4 and the Free Guide list. If those are near-zero despite Multiplier completions, item 1 or 2 is the break.
