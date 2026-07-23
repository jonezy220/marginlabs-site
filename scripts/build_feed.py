#!/usr/bin/env python3
"""
Generate /the-lab/feed.xml — RSS 2.0 feed with full article bodies for
Substack import. Each item carries title, description, and a content:encoded
element with the full article HTML + end-of-article CTAs, with all internal
links rewritten to absolute marginlabs.io URLs and tagged with utm_source.

Re-run after publishing a new article or editing existing ones.

Usage:
    python3 scripts/build_feed.py
"""

import html
import re
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parent.parent
LAB_DIR = SITE_ROOT / "the-lab"
FEED_PATH = LAB_DIR / "feed.xml"

SITE_URL = "https://marginlabs.io"
LAB_URL = f"{SITE_URL}/the-lab"
UTM_SUFFIX = "utm_source=substack&utm_medium=newsletter&utm_campaign=lab"

# Slug -> ISO publication date (UTC). Spread across the article's stated
# month so RSS readers and Substack import order matches the Lab index.
ARTICLES = [
    # March 2026
    ("margin-multiplier-explained",                "2026-03-06"),
    ("how-to-read-a-payments-pl",                  "2026-03-13"),
    ("what-embedded-payments-costs",               "2026-03-18"),
    ("why-merchants-dont-use-payments",            "2026-03-22"),
    # April 2026
    ("payfac-vs-iso",                              "2026-04-03"),
    ("how-saas-companies-make-money-from-payments","2026-04-08"),
    ("what-is-a-payment-facilitator",              "2026-04-14"),
    ("how-to-choose-an-embedded-payments-provider","2026-04-19"),
    ("embedded-payments-vertical-saas",            "2026-04-24"),
    ("payfac-as-a-service",                        "2026-04-29"),
    # May 2026
    ("calculate-payments-revenue",                 "2026-05-01"),
    ("embedded-vs-integrated-payments",            "2026-05-04"),
    ("how-to-negotiate-a-processor-agreement",     "2026-05-05"),
    ("chargeback-management-for-software-platforms","2026-05-07"),
    ("payments-revenue-saas-valuation",            "2026-05-12"),
    ("pci-compliance-for-saas-platforms",          "2026-05-19"),
    ("merchant-onboarding-embedded-payments",      "2026-05-28"),
    # June 2026
    ("should-you-become-a-payment-facilitator",    "2026-06-02"),
    ("how-much-saas-platforms-make-from-payments", "2026-06-04"),
    ("merchant-of-record-vs-payfac",               "2026-06-04"),
    ("payment-processor-for-saas",                 "2026-06-04"),
    ("payfac-vs-isv",                              "2026-07-13"),
    # 2026-06-11 batch: KPIs hero (rewrite), Merchant Activation pillar (new),
    # PE diligence (absorbed the comprehensive ML-LAB-027 draft). Dates bumped
    # so the republished pieces surface as fresh in the feed and Lab index.
    ("merchant-activation-playbook",               "2026-06-11"),
    ("payments-due-diligence",                     "2026-06-11"),
    ("payments-kpis-after-launch",                 "2026-06-11"),
    ("pfaas-provider-strengths-and-weaknesses",    "2026-06-16"),
    # 2026-06-18 batch: front-loaded high-volume SEO pillars (per 1B). Surcharging
    # (Optimization cluster, 10K-100K vol) + Build vs Buy vs Partner (Selection hub).
    ("surcharging-for-software-platforms",         "2026-06-18"),
    ("build-vs-buy-vs-partner-payments",           "2026-06-18"),
    # 2026-06-22: US + LATAM positioning anchor (cross-border embedded payments).
    ("cross-border-embedded-payments-latam",       "2026-06-22"),
    # 2026-06-23: Expansion pillar, embedded finance (1K-10K SEO vein).
    ("embedded-finance-for-vertical-saas",         "2026-06-23"),
    # 2026-06-25: Optimization cluster, interchange (1K-10K SEO vein).
    ("interchange-optimization-for-platforms",     "2026-06-25"),
    # 2026-06-24: long-tail commercial-intent gaps. Gateway build cost (Selection
    # cluster, build-vs-buy vein) + payfac compliance requirements (operational,
    # distinct from the PCI piece). Both target zero-coverage GSC demand.
    ("cost-to-build-a-payment-gateway",            "2026-06-24"),
    ("payfac-compliance-requirements",             "2026-06-24"),
    # 2026-06-30: dual-track flagship. Payments as a PE value-creation lever
    # (Chris's job-search thesis + advisory-pipeline content for PE-backed platforms).
    ("payments-value-creation-lever-pe",           "2026-06-30"),
    # 2026-07-01: readiness/decision piece (should you monetize payments + which model first).
    # AEO-structured (question H2s, direct-answer block, first-person FAQ). QSC feeder.
    ("should-your-platform-monetize-payments",     "2026-07-01"),
    # 2026-07-06: Implementation cluster PILLAR. Six-stage roadmap from decision
    # to live and past live. Anchor for the KYB (Tue) and recurring-billing (Wed)
    # spokes. AEO-structured (question H2s, direct-answer block, 4-Q FAQ). QSC CTA.
    ("embedded-payments-implementation-roadmap",   "2026-07-06"),
    # 2026-07-08: Implementation cluster SPOKE (step 3). Merchant underwriting + KYB,
    # what the platform owns once it moves above referral. Links up to the roadmap
    # pillar. AEO-structured (question H2s, direct-answer block, 4-Q FAQ). QSC CTA.
    ("merchant-underwriting-kyb",                  "2026-07-08"),
    # 2026-07-09: Implementation cluster SPOKE (part of step 6, operate what you own).
    # Recurring billing x the payments stack: the seam where recurring revenue leaks
    # (failed payments, dunning, reconciliation). Links up to the roadmap pillar.
    ("recurring-billing-and-the-payments-stack",  "2026-07-09"),
    # 2026-07-13: payments-model cluster. Optimize the current model (AEO-first),
    # change-model (reframe of the retired when-to-switch, which now 301s here), and
    # evaluate-vendor (fit over price). Hub-and-spoke: all funnel into payfac-vs-isv.
    ("optimize-your-payments-model",              "2026-07-13"),
    ("should-you-change-your-payments-model",     "2026-07-13"),
    ("how-to-evaluate-a-payments-vendor",         "2026-07-13"),
    ("payments-100-day-plan-pe",                  "2026-07-16"),
    ("payments-benchmarks-for-software-platforms","2026-07-20"),
    ("embedded-finance-examples-vertical-saas",   "2026-07-23"),
]

# Brand CSS variables → fallback hex (Substack won't resolve var(...) refs).
CSS_VAR_REPLACEMENTS = [
    (r"var\(--copper-lt[^)]*\)",  "#D8A058"),
    (r"var\(--copper[^)]*\)",     "#C8823C"),
    (r"var\(--text[^)]*\)",       "#F0EBE4"),
    (r"var\(--dim[^)]*\)",        "#8a8580"),
    (r"var\(--dimmer[^)]*\)",     "#6a6560"),
    (r"var\(--bg4[^)]*\)",        "#1a1a1a"),
    (r"var\(--bg5[^)]*\)",        "#222"),
    (r"var\(--surface-2[^)]*\)",  "#111"),
    (r"var\(--mono[^)]*\)",       "'DM Mono', monospace"),
]


def extract_meta(html_text: str) -> dict:
    title_match = re.search(r"<title>(.*?)</title>", html_text, re.IGNORECASE | re.DOTALL)
    desc_match = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']\s*/?>',
        html_text, re.IGNORECASE | re.DOTALL,
    )
    canonical_match = re.search(
        r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']\s*/?>',
        html_text, re.IGNORECASE | re.DOTALL,
    )
    if not (title_match and desc_match and canonical_match):
        raise ValueError("missing title/description/canonical")
    title = title_match.group(1).strip()
    title = re.sub(r"\s*\|\s*Margin Labs\s*$", "", title)
    return {
        "title": html.unescape(title),
        "description": html.unescape(desc_match.group(1).strip()),
        "canonical": canonical_match.group(1).strip(),
    }


def extract_body(html_text: str) -> str:
    """Extract <div class="article-body">...</div>. The body ends with the
    "← Back to The Lab" anchor that closes the <article> wrapper."""
    m = re.search(
        r'<div class="article-body">(.*?)</div>\s*<a href="/the-lab/" class="article-back">',
        html_text, re.DOTALL,
    )
    if not m:
        raise ValueError("article-body not found")
    return m.group(1).strip()


def extract_end_cta(html_text: str) -> str:
    """Extract the end-of-article CTA <section>...</section>."""
    m = re.search(
        r'<!--\s*──\s*END-OF-ARTICLE CTA[^-]*-->\s*(<section.*?</section>)',
        html_text, re.DOTALL,
    )
    if not m:
        raise ValueError("end-of-article CTA not found")
    return m.group(1).strip()


def rewrite_links(content: str, slug: str) -> str:
    """Rewrite relative URLs to absolute marginlabs.io URLs.

    href="/..." → absolute + utm_source=substack tracking (these are reader
                  navigation targets we want to attribute).
    src="/..."  → absolute, no utm (these are asset URLs — img, video, etc.).
    """
    def replace_href(match: re.Match) -> str:
        path = match.group(1)
        if path.startswith("//") or path.startswith("http"):
            return match.group(0)
        sep = "&" if "?" in path else "?"
        return f'href="{SITE_URL}{path}{sep}{UTM_SUFFIX}"'

    def replace_src(match: re.Match) -> str:
        path = match.group(1)
        if path.startswith("//") or path.startswith("http") or path.startswith("data:"):
            return match.group(0)
        return f'src="{SITE_URL}{path}"'

    content = re.sub(r'href="(/[^"]*)"', replace_href, content)
    content = re.sub(r'src="(/[^"]*)"', replace_src, content)
    return content


def replace_css_vars(content: str) -> str:
    for pattern, replacement in CSS_VAR_REPLACEMENTS:
        content = re.sub(pattern, replacement, content)
    return content


# Substack's editor/importer has no table support — it flattens any <table>
# into run-together text. For these articles the table IS the argument, so the
# feed swaps each <table> for a pre-rendered branded PNG of that table (in
# document order). The Lab HTML keeps the real tables; this only affects the
# Substack copy. Images live at /assets/lab-images/tables/{slug}-{n}.png.
TABLE_IMAGE_SLUGS = {
    "payments-due-diligence",
    "payfac-vs-isv",
    "merchant-of-record-vs-payfac",
    "payfac-as-a-service",
    "calculate-payments-revenue",
    # supporting articles (1 table each), added 2026-06-12
    "merchant-activation-playbook",
    "what-is-a-payment-facilitator",
    "payment-processor-for-saas",
    "pci-compliance-for-saas-platforms",
    "how-to-read-a-payments-pl",
}


def replace_tables_with_images(body: str, slug: str) -> str:
    if slug not in TABLE_IMAGE_SLUGS:
        return body
    counter = {"n": 0}

    def repl(_match: re.Match) -> str:
        counter["n"] += 1
        n = counter["n"]
        return (
            f'<img src="/assets/lab-images/tables/{slug}-{n}.png" '
            f'alt="{slug} comparison table {n}" />'
        )

    return re.sub(r"<table[^>]*>.*?</table>", repl, body, flags=re.DOTALL)


def strip_data_analytics(content: str) -> str:
    return re.sub(r'\s+data-analytics="[^"]*"', "", content)


def build_content_encoded(html_text: str, slug: str, canonical: str) -> str:
    body = extract_body(html_text)
    body = replace_tables_with_images(body, slug)
    end_cta = extract_end_cta(html_text)

    # Source-attribution note at the END so Substack's auto-generated SEO
    # description and social card pick up the article's actual first
    # paragraph instead of this attribution line.
    source_note = (
        f'<p style="font-size:13px;color:#8a8580;font-style:italic;'
        f'margin-top:32px;">This article was originally published on '
        f'<a href="{canonical}?{UTM_SUFFIX}" style="color:#D8A058;">'
        f'Margin Labs</a>.</p>'
    )

    combined = body + "\n" + end_cta + "\n" + source_note
    combined = rewrite_links(combined, slug)
    combined = replace_css_vars(combined)
    combined = strip_data_analytics(combined)
    return combined


def rfc822(date_str: str) -> str:
    dt = datetime.fromisoformat(date_str).replace(tzinfo=timezone.utc, hour=14)
    return format_datetime(dt)


def xml_escape(s: str) -> str:
    return (
        s.replace("&", "&amp;")
         .replace("<", "&lt;")
         .replace(">", "&gt;")
    )


def cdata_wrap(content: str) -> str:
    # Escape any literal "]]>" sequence so it can't terminate the CDATA early.
    safe = content.replace("]]>", "]]]]><![CDATA[>")
    return f"<![CDATA[{safe}]]>"


def build_feed() -> str:
    items_xml = []
    for slug, date_str in reversed(ARTICLES):  # newest first
        article_path = LAB_DIR / f"{slug}.html"
        html_text = article_path.read_text(encoding="utf-8")
        meta = extract_meta(html_text)
        content_encoded = build_content_encoded(html_text, slug, meta["canonical"])

        items_xml.append(
            "    <item>\n"
            f"      <title>{xml_escape(meta['title'])}</title>\n"
            f"      <link>{xml_escape(meta['canonical'])}</link>\n"
            f"      <guid isPermaLink=\"true\">{xml_escape(meta['canonical'])}</guid>\n"
            f"      <pubDate>{rfc822(date_str)}</pubDate>\n"
            f"      <description>{xml_escape(meta['description'])}</description>\n"
            f"      <content:encoded>{cdata_wrap(content_encoded)}</content:encoded>\n"
            "    </item>"
        )

    last_build = format_datetime(datetime.now(timezone.utc))
    most_recent_pub = rfc822(max(d for _, d in ARTICLES))

    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0"\n'
        '     xmlns:atom="http://www.w3.org/2005/Atom"\n'
        '     xmlns:content="http://purl.org/rss/1.0/modules/content/">\n'
        '  <channel>\n'
        '    <title>The Lab — Margin Labs</title>\n'
        f'    <link>{LAB_URL}</link>\n'
        '    <description>Independent thinking on embedded payments, model selection, and the margin hiding in your platform.</description>\n'
        '    <language>en-us</language>\n'
        f'    <atom:link href="{LAB_URL}/feed.xml" rel="self" type="application/rss+xml" />\n'
        f'    <lastBuildDate>{last_build}</lastBuildDate>\n'
        f'    <pubDate>{most_recent_pub}</pubDate>\n'
        '    <generator>scripts/build_feed.py</generator>\n'
        + "\n".join(items_xml) + "\n"
        '  </channel>\n'
        '</rss>\n'
    )


def main():
    feed = build_feed()
    FEED_PATH.write_text(feed, encoding="utf-8")
    print(f"Wrote {FEED_PATH} ({len(ARTICLES)} items, {len(feed)} bytes)")


if __name__ == "__main__":
    main()
