# Brevo Automation Workflow Build Guide

**Why this is a manual step:** Brevo's public API creates contact attributes, lists, and email
templates (all handled by `scripts/brevo-setup.js`), but it does **not** expose an endpoint to
create marketing-automation workflows. The entry trigger, wait steps, and send steps have to be
assembled in the Brevo dashboard under **Automations**. That is the only part that needs clicking.

All copy is already staged. Run `node scripts/brevo-setup.js` any time to refresh the 17 templates.

## Before you start
- Build each workflow **switched OFF**. Do not click Activate until you've reviewed the flow and
  sent yourself a test. These send real email.
- In each **Send an email** step, pick the template by the name in the tables below (IDs listed as a
  cross-check, but Brevo shows them by name).
- Entry condition for every workflow: **A contact is added to list X**. Set **"a contact can enter
  this automation only once"** = ON.
- Suggested global exclusion: skip entry if the contact is on **Hot Leads (list 7)** so people in
  Chris's active personal outreach don't also get cold drip.

---

## WF2 — Calculator / Multiplier Lead → **Multiplier Leads (list 4)**
Fires when someone completes the Margin Multiplier email gate.

| Step | Wait | Template name | ID |
|------|------|---------------|----|
| 1 | 2 days  | `ml-wf2-day2`  | 5 |
| 2 | 3 days  | `ml-wf2-day5`  | 6 |
| 3 | 4 days  | `ml-wf2-day9`  | 7 |
| 4 | 5 days  | `ml-wf2-day14` | 8 |

Uses `{{ contact.RECOMMENDED_MODEL }}` and `{{ contact.OPPORTUNITY_GAP }}` merge tags — confirm those
attributes are populated by the calculator submission before activating.

## WF4 — Consulting / Advisory Inquiry → **Advisory Leads (list 5)**
Fires on an advisory / consult form submission.

| Step | Wait | Template name | ID |
|------|------|---------------|----|
| 1 | immediate (0 days) | `ml-wf4-immediate` | 13 |
| 2 | 3 days             | `ml-wf4-day3`      | 14 |

Note: this is a light 2-touch nurture. Chris follows up personally within 48 hours; the automation
is just the safety net + top-of-mind resource.

## WF3 — Post-Purchase (Framework buyers) → **Framework Customers (list 6)**
Fires when a Stripe purchase adds the buyer to Framework Customers.

| Step | Wait | Template name | ID |
|------|------|---------------|----|
| 1 | 3 days  | `ml-wf3-day3`  | 9  |
| 2 | 7 days  | `ml-wf3-day7`  | 10 |
| 3 | 14 days | `ml-wf3-day14` | 11 |
| 4 | 21 days | `ml-wf3-day21` | 12 |

## WF5 — Lab Subscriber Nurture → **Lab Subscribers (list 12)**
Fires when someone opts in from a Lab article email capture.

| Step | Wait | Template name | ID |
|------|------|---------------|----|
| 1 | 2 days  | `ml-wf5-day2`  | 29 |
| 2 | 7 days  | `ml-wf5-day7`  | 30 |
| 3 | 14 days | `ml-wf5-day14` | 31 |

## WF1 — Free Guide Nurture → **Free Guide Leads (list 3)**  *(optional / already scoped)*
Fires when someone downloads the free guide.

| Step | Wait | Template name | ID |
|------|------|---------------|----|
| 1 | 2 days  | `ml-wf1-day2`  | 1 |
| 2 | 5 days  | `ml-wf1-day5`  | 2 |
| 3 | 9 days  | `ml-wf1-day9`  | 3 |
| 4 | 14 days | `ml-wf1-day14` | 4 |

---

## Open item — brevo-subscribe.js hardcoded list bug
`api/brevo-subscribe.js` hardcodes a master list id of `[2]`, which does **not** exist in the
account. Captures still succeed because the per-source `additionalListIds` are what actually place
the contact (e.g. Lab capture passes `[12]`), but the phantom `[2]` write is dead weight and should
be removed or repointed to a real "All Subscribers" master list. Track before scaling list-based
segmentation.
