# ISV Referral vs. PayFac-lite: How to Choose Your First Embedded Payments Model

**Eyebrow:** The Lab
**Meta description:** The two most common starting points for SaaS platforms entering embedded payments — and the decision criteria that actually matter.
**Est. read time:** 5 min
**Date:** March 2026

---

Most SaaS platforms enter embedded payments the same way: someone on the payments or product team runs a back-of-napkin calculation, concludes the revenue opportunity is real, and then hits a wall trying to figure out which model to actually pursue.

Two options dominate early-stage decisions: ISV Referral and PayFac-lite (also called PayFac-as-a-Service). They look similar from the outside — both let you monetize payments without becoming a full payment facilitator — but they are structurally different products with different economics, different risk profiles, and different ceilings.

Here's how to think through the choice.

---

## What ISV Referral Actually Is

In an ISV Referral arrangement, your platform refers merchants to a processor or acquirer. The processor owns the merchant relationship, handles underwriting, and manages risk. You get a residual — typically a percentage of the merchant's processing volume — for as long as those merchants stay on the program.

The economics are straightforward: residuals usually run 10–25 basis points on volume, depending on vertical, average ticket, and how hard you negotiated. On $10M in monthly GMV, that's $10K–$25K/month. Predictable, low-maintenance, and requires almost nothing from your engineering team to stand up.

The tradeoff: you're at the bottom of the economics stack. The processor keeps the majority of margin. You have no pricing control. And because you don't own the merchant relationship, switching costs are lower — for both the merchant and the processor.

Referral works best when your platform is still proving product-market fit in payments, when merchant volume is below $5M/month, or when the compliance and operational overhead of a deeper model isn't justified yet.

---

## What PayFac-lite Actually Is

PayFac-lite (often called PayFac-as-a-Service) is a fundamentally different structure. You register as a payment facilitator — or a "master merchant" — through a sponsoring bank or processor. Your merchants become sub-merchants under your umbrella. You handle (or co-handle) onboarding, underwriting decisions, and risk monitoring. The processor provides the rails, the bank holds the accounts, but you own the economics and the experience.

The revenue profile is materially different: net revenue of 40–80+ basis points is achievable, depending on vertical and card mix. On that same $10M in monthly GMV, you're looking at $40K–$80K/month — a 3–4x lift over referral.

But you're earning it. PayFac-lite introduces:

- **Underwriting liability.** You're now on the hook for merchant losses above your reserve thresholds. Fraud, chargebacks, and merchant failure become your problem to manage.
- **Compliance obligations.** KYC/KYB requirements, OFAC screening, PCI scope changes — these aren't optional.
- **Operational overhead.** Merchant onboarding queues, dispute workflows, and funding delays all land in your lap. Someone on your team owns them.
- **Contractual complexity.** Your agreement with the sponsor bank will govern risk appetite, reserve requirements, and what merchant categories you can board. Read it carefully.

PayFac-lite is the right move when your platform has consistent, predictable GMV (generally $5M+/month), merchants with relatively low fraud and chargeback rates, and the internal capacity to build or buy the ops stack around it.

---

## The Decision Framework

Neither model is obviously better. The right one depends on where you are.

**Start with ISV Referral if:**
- You're pre-product-market fit on payments
- GMV is below $5M/month
- You don't have a risk/ops function
- You want to validate merchant adoption before committing to infrastructure

**Move to PayFac-lite when:**
- GMV is consistent and growing past $5M/month
- You've identified that referral revenue is leaving meaningful margin on the table
- Your merchant base skews toward lower-risk verticals (SMB software, professional services, B2B SaaS)
- You have — or can hire — someone to own the compliance and ops layer

One thing worth naming: the decision isn't permanent. Most platforms that do this well start with referral, run it for 12–18 months to understand their merchant base, and upgrade to PayFac-lite once they have the volume and the data to underwrite confidently.

---

## What the Numbers Actually Look Like

The Margin Multiplier models both options against your specific GMV, vertical, and card mix. A $10M/month platform in a mid-risk vertical can typically expect:

- **ISV Referral:** $15K–$20K/month net revenue
- **PayFac-lite:** $50K–$70K/month net revenue (before ops costs)

That gap — roughly $35K–$50K/month, or $400K–$600K annually — is what justifies the operational investment. At scale, it's often what separates payments as a rounding error from payments as a meaningful business line.

---

## The Part Most Platforms Miss

The model you choose shapes more than the economics. It shapes the merchant experience, your onboarding funnel, your support load, and how much leverage you have with your processor when you're ready to renegotiate.

ISV Referral is easy to start and hard to optimize. PayFac-lite is harder to start and much more defensible once it's running. Choose based on where you want to be in 18 months, not where you are today.

If you're trying to model what either option looks like for your specific platform, [run the numbers in the Margin Multiplier](/margin-multiplier.html). If you want to talk through the decision before committing to a direction, [start a conversation](/contact).

---

*—Margin Labs*
