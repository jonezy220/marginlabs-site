#!/usr/bin/env python3
"""Retarget each Lab article's END-OF-ARTICLE CTA to its cluster's purchase path
(per Content/SEO-CLUSTER-MAP.md). Replaces the whole END-CTA <section> with a
canonical block for the assigned flavor. Preserves the feed contract:
the comment marker `<!-- ── END-OF-ARTICLE CTA ... -->` + a single <section>.

Flavors:
  mm_consult  — Multiplier primary, consult secondary  (research intent; current default)
  mm_fw       — Multiplier primary, Framework secondary (economics)
  fw_qsc      — Framework primary, QSC secondary        (model decision)
  qsc_fw      — QSC primary, Framework secondary        (provider / ops / compliance / exit)

Idempotent: re-running yields the same output. Run from repo root or anywhere.
"""
import re
from pathlib import Path

LAB = Path(__file__).resolve().parent.parent / "the-lab"

MARKER = '<!-- ── END-OF-ARTICLE CTA ──────────────────────── -->'

# Shared inline styles (match existing markup exactly).
SEC = ('<section style="background:var(--surface-2,#111);border-top:1px solid '
       'rgba(200,130,60,0.14);padding:72px 24px;">')
WRAP = '  <div style="max-width:600px;margin:0 auto;text-align:center;">'
EYE = ('    <div style="font-family:var(--mono,\'DM Mono\',monospace);font-size:9px;'
       'letter-spacing:0.22em;text-transform:uppercase;color:#C8823C;opacity:0.7;'
       'margin-bottom:12px;">{eyebrow}</div>')
H2 = ('    <h2 style="font-size:28px;font-weight:300;letter-spacing:-0.02em;'
      'line-height:1.3;margin-bottom:14px;color:var(--text,#F0EBE4);">{headline}</h2>')
P = ('    <p style="font-size:15px;font-weight:300;color:var(--dim,rgba(240,235,228,0.52));'
     'line-height:1.75;margin-bottom:32px;max-width:480px;margin-left:auto;'
     'margin-right:auto;">{para}</p>')
ROW_OPEN = ('    <div style="display:flex;gap:16px;justify-content:center;'
            'align-items:center;flex-wrap:wrap;">')
PRIMARY = ('      <a href="{href}" style="display:inline-block;background:#C8823C;'
           'color:#0d0d0d;border:none;border-radius:2px;font-family:\'DM Mono\',monospace;'
           'font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;'
           'padding:14px 28px;cursor:pointer;text-decoration:none;" '
           'data-analytics="{da}">{label}</a>')
SECONDARY = ('      <a href="{href}" style="font-family:\'DM Mono\',monospace;font-size:9px;'
             'letter-spacing:0.14em;text-transform:uppercase;color:#C8823C;'
             'text-decoration:none;opacity:0.75;" data-analytics="{da}">{label}</a>')
ROW_CLOSE = '    </div>'
WRAP_CLOSE = '  </div>'
SEC_CLOSE = '</section>'

FLAVORS = {
    "mm_consult": dict(
        eyebrow="Want to go further?",
        headline="See what your payments program could be worth.",
        para=("The Margin Multiplier turns your volume and model into a directional "
              "revenue number in two minutes. A conversation turns it into a plan."),
        primary=("/margin-multiplier", "Run the Margin Multiplier →", "article-cta-mm-primary"),
        secondary=("/advisory", "Or talk to me about your specific situation →", "article-cta-consult-secondary"),
    ),
    "mm_fw": dict(
        eyebrow="Want to go further?",
        headline="See what your payments program could be worth.",
        para=("The Margin Multiplier turns your volume and model into a directional "
              "revenue number in two minutes. The Framework helps you decide which "
              "model gets you there."),
        primary=("/margin-multiplier", "Run the Margin Multiplier →", "article-cta-mm-primary"),
        secondary=("/framework", "Or decide your model with the Framework →", "article-cta-framework-secondary"),
    ),
    "fw_qsc": dict(
        eyebrow="Which model fits you?",
        headline="Decide it with a framework, not a guess.",
        para=("The Strategic Decision Framework walks you through the model choice step "
              "by step, with the math and the volume thresholds laid out. Want a second "
              "pair of eyes on your actual numbers? A Quick Start Call does it with you."),
        primary=("/framework", "Get the Framework →", "article-cta-framework-primary"),
        secondary=("/advisory", "Or book a Quick Start Call →", "article-cta-consult-secondary"),
    ),
    "qsc_fw": dict(
        eyebrow="Want a second opinion?",
        headline="Talk it through against your actual numbers.",
        para=("Every platform's starting point is different. A Quick Start Call works "
              "the decision with you, against your real volume, merchant mix and product, "
              "and I make the intro when it fits. Prefer to decide on your own first? "
              "The Framework walks you through it."),
        primary=("/advisory", "Book a Quick Start Call →", "article-cta-consult-primary"),
        secondary=("/framework", "Or decide it yourself with the Framework →", "article-cta-framework-secondary"),
    ),
}

# Article -> flavor assignment (per SEO-CLUSTER-MAP.md).
ASSIGN = {
    # research (unchanged default)
    "what-is-a-payment-facilitator": "mm_consult",
    "embedded-vs-integrated-payments": "mm_consult",
    "embedded-payments-vertical-saas": "mm_consult",
    # economics
    "how-saas-companies-make-money-from-payments": "mm_fw",
    "how-much-saas-platforms-make-from-payments": "mm_fw",
    "calculate-payments-revenue": "mm_fw",
    "what-embedded-payments-costs": "mm_fw",
    "margin-multiplier-explained": "mm_fw",
    "how-to-read-a-payments-pl": "mm_fw",
    # model decision
    "payfac-vs-isv": "fw_qsc",
    "payfac-vs-iso": "fw_qsc",
    "merchant-of-record-vs-payfac": "fw_qsc",
    "should-you-become-a-payment-facilitator": "fw_qsc",
    # provider selection
    "pfaas-provider-strengths-and-weaknesses": "qsc_fw",
    "how-to-choose-an-embedded-payments-provider": "qsc_fw",
    "payment-processor-for-saas": "qsc_fw",
    "payfac-as-a-service": "qsc_fw",
    # economics / exit intent
    "payments-revenue-saas-valuation": "qsc_fw",
    # operations
    "merchant-activation-playbook": "qsc_fw",
    "why-merchants-dont-use-payments": "qsc_fw",
    "merchant-onboarding-embedded-payments": "qsc_fw",
    "payments-kpis-after-launch": "qsc_fw",
    "chargeback-management-for-software-platforms": "qsc_fw",
    "when-to-switch-embedded-payments-providers": "qsc_fw",
    "how-to-negotiate-a-processor-agreement": "qsc_fw",
    # compliance / diligence
    "payments-due-diligence": "qsc_fw",
    "pci-compliance-for-saas-platforms": "qsc_fw",
}

CTA_RE = re.compile(
    r'<!--\s*──\s*END-OF-ARTICLE CTA[^>]*-->\s*<section.*?</section>',
    re.DOTALL,
)


def build_section(flavor: str) -> str:
    f = FLAVORS[flavor]
    ph, pl, pda = f["primary"]
    sh, sl, sda = f["secondary"]
    return "\n".join([
        MARKER,
        SEC,
        WRAP,
        EYE.format(eyebrow=f["eyebrow"]),
        H2.format(headline=f["headline"]),
        P.format(para=f["para"]),
        ROW_OPEN,
        PRIMARY.format(href=ph, label=pl, da=pda),
        SECONDARY.format(href=sh, label=sl, da=sda),
        ROW_CLOSE,
        WRAP_CLOSE,
        SEC_CLOSE,
    ])


def main():
    changed, skipped = [], []
    for slug, flavor in ASSIGN.items():
        path = LAB / f"{slug}.html"
        text = path.read_text(encoding="utf-8")
        new_section = build_section(flavor)
        m = CTA_RE.search(text)
        if not m:
            skipped.append(f"{slug} (no END-CTA found)")
            continue
        if m.group(0).strip() == new_section.strip():
            skipped.append(f"{slug} (already {flavor})")
            continue
        text = text[:m.start()] + new_section + text[m.end():]
        path.write_text(text, encoding="utf-8")
        changed.append(f"{slug} -> {flavor}")
    print(f"CHANGED ({len(changed)}):")
    for c in changed:
        print(f"  {c}")
    print(f"\nSKIPPED ({len(skipped)}):")
    for s in skipped:
        print(f"  {s}")


if __name__ == "__main__":
    main()
