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
    ("isv-referral-vs-payfac-lite",                "2026-03-27"),
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
    """href="/..." → absolute marginlabs.io URLs with utm_source=substack."""
    def replace(match: re.Match) -> str:
        path = match.group(1)
        if path.startswith("//") or path.startswith("http"):
            return match.group(0)
        sep = "&" if "?" in path else "?"
        return f'href="{SITE_URL}{path}{sep}{UTM_SUFFIX}"'

    return re.sub(r'href="(/[^"]*)"', replace, content)


def replace_css_vars(content: str) -> str:
    for pattern, replacement in CSS_VAR_REPLACEMENTS:
        content = re.sub(pattern, replacement, content)
    return content


def strip_data_analytics(content: str) -> str:
    return re.sub(r'\s+data-analytics="[^"]*"', "", content)


def build_content_encoded(html_text: str, slug: str, canonical: str) -> str:
    body = extract_body(html_text)
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
