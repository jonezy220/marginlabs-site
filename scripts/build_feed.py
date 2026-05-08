#!/usr/bin/env python3
"""
Generate /the-lab/feed.xml — RSS 2.0 feed of all published Lab articles.

Reads each article's HTML, extracts <title>, <meta name="description">,
and <link rel="canonical">. Pairs each article with a pubDate from the
ARTICLES list below (slug -> ISO date). Re-run after adding a new article
or republishing an existing one.

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

# Slug -> ISO publication date (UTC). Spread across the article's stated
# month so RSS readers and Substack import order matches the Lab index.
# When you publish a new article, append it here and re-run.
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


def rfc822(date_str: str) -> str:
    dt = datetime.fromisoformat(date_str).replace(tzinfo=timezone.utc, hour=14)
    return format_datetime(dt)


def xml_escape(s: str) -> str:
    return (
        s.replace("&", "&amp;")
         .replace("<", "&lt;")
         .replace(">", "&gt;")
    )


def build_feed() -> str:
    items_xml = []
    # Newest first
    for slug, date_str in reversed(ARTICLES):
        article_path = LAB_DIR / f"{slug}.html"
        meta = extract_meta(article_path.read_text(encoding="utf-8"))
        items_xml.append(
            "    <item>\n"
            f"      <title>{xml_escape(meta['title'])}</title>\n"
            f"      <link>{xml_escape(meta['canonical'])}</link>\n"
            f"      <guid isPermaLink=\"true\">{xml_escape(meta['canonical'])}</guid>\n"
            f"      <pubDate>{rfc822(date_str)}</pubDate>\n"
            f"      <description>{xml_escape(meta['description'])}</description>\n"
            "    </item>"
        )

    last_build = format_datetime(datetime.now(timezone.utc))
    most_recent_pub = rfc822(max(d for _, d in ARTICLES))

    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n'
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
