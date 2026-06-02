#!/usr/bin/env python3
"""
One-time sweep of active Brevo-related files to align with canonical pricing,
product naming, and Margin Labs style rules.

Touches the 5 active files only. Leaves v1 history and the marginlabs-brief
implementation doc untouched (those are historical per the "only edit latest
version" rule).

Active files:
- scripts/brevo-setup.js         (deployed, pushes templates to Brevo)
- brevo-sequences.md             (sequence template doc)
- build_brevo_automation_plan_v2.py (canonical plan builder)
- build_email_waterfalls.js      (old waterfalls builder, still in tree)
- email-waterfalls-plan.md       (old waterfalls plan doc)

Transforms (in order):
1. Pricing & product naming:
   - $997 → $697
   - Implementation Toolkit → Execution Playbook
   - implementation-toolkit → execution-playbook (URL slugs, asset names)
   - purchase-997 → purchase-697 (template names)
   - $300 (vs. the regular $500 rate) → killed (QSC never discounted; $500 was wrong anyway)
2. URL destinations (404 → canonical):
   - marginlabs.io/strategic-framework → marginlabs.io/#products
   - marginlabs.io/book-call → marginlabs.io/advisory
   - marginlabs.io/execution-playbook → marginlabs.io/advisory
3. Stale "Primer" branding → "Strategic Decision Framework":
   - "Embedded Payments Primer" → "Embedded Payments Strategic Framework"
   - "your Primer"/"the Primer" → "the Framework"
   - "Primer Customer" (Brevo tag) → "Framework Customer"
4. Style:
   - "— Chris, Margin Labs" sign-off → "Chris, Margin Labs"
   - Markdown headings "# X — Y" → "# X: Y"
   - Generic " — " (em-dash with spaces) → ", " (comma)
   - Hyphen-minus em-dash repair (literal "--" used as em-dash) → ", "

What this script does NOT touch:
- Fabricated case studies (HV-2, HV-7 testimonial, UP-2). Those need a
  judgment call (rewrite vs. delete). Flagged for manual review.
- Oxford commas. Too risky for blind regex (false positives on compound
  sentences). Spot-fix instead.
- Number ranges with em-dashes ($5M—$10M, $1–5M). En-dashes left as-is.

Usage:
    python3 scripts/sweep_brevo_content.py [--dry-run]
"""

import re
import sys
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parent.parent

ACTIVE_FILES = [
    SITE_ROOT / "scripts" / "brevo-setup.js",
    SITE_ROOT / "brevo-sequences.md",
    SITE_ROOT / "build_brevo_automation_plan_v2.py",
    SITE_ROOT / "build_email_waterfalls.js",
    SITE_ROOT / "email-waterfalls-plan.md",
]


def sweep(text: str) -> tuple:
    """Apply all transforms. Returns (new_text, change_log)."""
    log = []
    orig = text

    # ── 1. Pricing & product naming ─────────────────────────────────────
    n = len(re.findall(r"\$997\b", text))
    text = re.sub(r"\$997\b", "$697", text)
    if n:
        log.append(("$997 → $697", n))

    n = len(re.findall(r"Implementation Toolkit", text))
    text = text.replace("Implementation Toolkit", "Execution Playbook")
    if n:
        log.append(("Implementation Toolkit → Execution Playbook", n))

    n = len(re.findall(r"implementation-toolkit", text))
    text = text.replace("implementation-toolkit", "execution-playbook")
    if n:
        log.append(("implementation-toolkit → execution-playbook (slugs)", n))

    n = len(re.findall(r"purchase-997", text))
    text = text.replace("purchase-997", "purchase-697")
    if n:
        log.append(("purchase-997 → purchase-697 (template names)", n))

    # ── 2. URL destinations ─────────────────────────────────────────────
    replacements = [
        ("marginlabs.io/strategic-framework",  "marginlabs.io/#products"),
        ("marginlabs.io/book-call",            "marginlabs.io/advisory"),
        ("marginlabs.io/execution-playbook",   "marginlabs.io/advisory"),
    ]
    for old, new in replacements:
        n = text.count(old)
        text = text.replace(old, new)
        if n:
            log.append((f"{old} → {new}", n))

    # ── 3. Stale "Primer" branding ──────────────────────────────────────
    # Specific phrases first (longer match wins), then generic.
    primer_replacements = [
        ("Embedded Payments Primer",  "Embedded Payments Strategic Framework"),
        ("Primer Customer",            "Framework Customer"),
        ("the Primer",                 "the Framework"),
        ("Your Primer",                "Your Framework"),
        ("your Primer",                "your Framework"),
        ("the primer",                 "the Framework"),
        ("Primer should have arrived","Framework should have arrived"),
        ("Primer track",               "Framework track"),
        ("Primer.",                    "Framework."),
        ("Primer,",                    "Framework,"),
    ]
    for old, new in primer_replacements:
        n = text.count(old)
        text = text.replace(old, new)
        if n:
            log.append((f"'{old}' → '{new}'", n))

    # ── 4. QSC discount block removal ───────────────────────────────────
    # Multi-line specific surgical removals.
    qsc_discount_patterns = [
        # build_email_waterfalls.js T-4 (lines 354-362)
        (
            r'\s*"---",\s*\n\s*"YOUR INCLUDED STRATEGY CALL DISCOUNT",[^]]*?'
            r'"This offer doesn\'t expire\. Use it when it\'s actually useful\.",\s*\n',
            '\n',
        ),
        # email-waterfalls-plan.md T-4 block (similar phrasing in markdown)
        (
            r'\n\*\*YOUR INCLUDED STRATEGY CALL DISCOUNT\*\*[^*]*?'
            r'(?=\n---|\n\*\*|\n##)',
            '\n',
        ),
    ]
    for pattern, replacement in qsc_discount_patterns:
        before = len(text)
        text = re.sub(pattern, replacement, text)
        if len(text) != before:
            log.append((f"removed QSC discount block (saved {before - len(text)} chars)", 1))

    # Sentence-level discount mentions (UP-3 style: "discounted strategy call at $300 (vs. the regular $500 rate)").
    n = len(re.findall(r"discounted strategy call at \$300 \(vs\. the regular \$500 rate\)", text))
    text = re.sub(
        r"discounted strategy call at \$300 \(vs\. the regular \$500 rate\)",
        "Quick Start Call",
        text,
    )
    if n:
        log.append(("removed QSC discount phrasing", n))

    # Generic stale anchor "$500 rate" mentions for QSC.
    n = len(re.findall(r"(?:the )?regular \$500 rate", text))
    text = re.sub(r"(?:the )?regular \$500 rate", "$379", text)
    if n:
        log.append(("'regular $500 rate' → '$379'", n))

    # ── 5. Style: em-dash sweep ─────────────────────────────────────────
    # 5a. Sign-off: "— Chris, Margin Labs" → "Chris, Margin Labs"
    n = len(re.findall(r"—\s*Chris,\s*Margin Labs", text))
    text = re.sub(r"—\s*Chris,\s*Margin Labs", "Chris, Margin Labs", text)
    if n:
        log.append(("sign-off em-dash dropped", n))

    # 5b. Markdown headings: "# X — Y" → "# X: Y"
    def fix_heading(m):
        return m.group(1) + ": " + m.group(2)
    n_head = 0
    new = []
    for line in text.split("\n"):
        m = re.match(r"^(#{1,6}\s+[^—\n]+?)\s+—\s+(.+)$", line)
        if m:
            n_head += 1
            new.append(m.group(1) + ": " + m.group(2))
        else:
            new.append(line)
    text = "\n".join(new)
    if n_head:
        log.append(("markdown headings ' — ' → ': '", n_head))

    # 5c. Generic " — " (em-dash with surrounding spaces) → ", " (safe default).
    # Avoid touching en-dashes (–) used in number ranges.
    n = len(re.findall(r" — ", text))
    text = re.sub(r" — ", ", ", text)
    if n:
        log.append(("body ' — ' → ', '", n))

    # 5d. Em-dash at start of line (sign-off pattern, callouts).
    n = len(re.findall(r"^—\s+", text, re.MULTILINE))
    text = re.sub(r"^—\s+", "", text, flags=re.MULTILINE)
    if n:
        log.append(("leading-line em-dash dropped", n))

    # 5e. Remaining lone em-dashes (no space context). These are typically
    # number ranges like "$5M—$10M" — convert to " to " for clarity.
    n = len(re.findall(r"(\d)—(\$?\d)", text))
    text = re.sub(r"(\d)—(\$?\d)", r"\1 to \2", text)
    if n:
        log.append(("number-range em-dash → ' to '", n))

    # 5f. Any final stray em-dash → comma.
    n = text.count("—")
    text = text.replace("—", ",")
    if n:
        log.append((f"residual em-dashes → ',' ({n} occurrences)", n))

    return text, log


def main():
    dry_run = "--dry-run" in sys.argv

    total_changes = 0
    for path in ACTIVE_FILES:
        if not path.exists():
            print(f"SKIP (missing): {path}")
            continue
        original = path.read_text(encoding="utf-8")
        new_text, log = sweep(original)

        if not log:
            print(f"clean: {path.relative_to(SITE_ROOT)}")
            continue

        if not dry_run:
            path.write_text(new_text, encoding="utf-8")

        print(f"\n{path.relative_to(SITE_ROOT)}:")
        for transform, count in log:
            print(f"   {count:>4}  {transform}")
            total_changes += count

    print(f"\n{'='*60}")
    print(f"Total transforms: {total_changes}")
    if dry_run:
        print("DRY RUN: no files modified.")
    else:
        print("Files modified in-place. Verify with git diff before staging.")


if __name__ == "__main__":
    main()
