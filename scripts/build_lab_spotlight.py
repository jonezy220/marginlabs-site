#!/usr/bin/env python3
"""
Build the "From The Lab" spotlight section on the homepage.

Reads the latest 3 articles from scripts/build_feed.py (ARTICLES list, newest
first when reversed), extracts title + meta description + date + read time
from each article HTML file, and rewrites the marker block in index.html.

Markers in index.html:
    <!-- LAB-SPOTLIGHT:START -->
    ... 3 card anchors ...
    <!-- LAB-SPOTLIGHT:END -->

Run after publishing a new article (i.e., after updating ARTICLES in
build_feed.py with the new slug + date).

Usage:
    python3 scripts/build_lab_spotlight.py
"""

import html
import re
import sys
from pathlib import Path
from typing import List, Optional

SITE_ROOT = Path(__file__).resolve().parent.parent
LAB_DIR = SITE_ROOT / "the-lab"
INDEX_PATH = SITE_ROOT / "index.html"

# Reuse the article registry from build_feed.py so there's a single source of truth.
sys.path.insert(0, str(SITE_ROOT / "scripts"))
from build_feed import ARTICLES  # noqa: E402

START_MARKER = "<!-- LAB-SPOTLIGHT:START -->"
END_MARKER = "<!-- LAB-SPOTLIGHT:END -->"

# Card description cap. Meta descriptions are SEO-tuned (often ~150-280 chars).
# Cards look best at one sentence or ~140 chars, whichever is shorter.
DESC_MAX_CHARS = 160


def extract_article_meta(slug: str) -> Optional[dict]:
    """Extract title, description, date, read_time from an article HTML file."""
    path = LAB_DIR / f"{slug}.html"
    if not path.exists():
        print(f"  WARN: missing article file for slug {slug!r} at {path}")
        return None
    text = path.read_text(encoding="utf-8")

    # H1 title. Strip any inline tags; truncate at first colon (subtitle delimiter).
    h1_match = re.search(r'<h1\s+class="article-title">(.*?)</h1>', text, re.DOTALL)
    if h1_match:
        title = html.unescape(re.sub(r"<[^>]+>", "", h1_match.group(1))).strip()
        if ":" in title:
            title = title.split(":", 1)[0].strip()
    else:
        title = slug.replace("-", " ").title()

    # Meta description. Take the first sentence (or truncate at DESC_MAX_CHARS).
    desc_match = re.search(
        r'<meta\s+name="description"\s+content="([^"]+)"', text
    )
    description = html.unescape(desc_match.group(1)).strip() if desc_match else ""
    description = _first_sentence_or_truncate(description, DESC_MAX_CHARS)

    # Date + read time from the two <span> elements in <div class="article-meta">.
    meta_block = re.search(
        r'<div\s+class="article-meta">(.*?)</div>', text, re.DOTALL
    )
    date = ""
    read_time = ""
    if meta_block:
        spans = re.findall(r"<span>([^<]+)</span>", meta_block.group(1))
        if len(spans) >= 1:
            date = spans[0].strip()
        if len(spans) >= 2:
            read_time = spans[1].strip()

    return {
        "slug": slug,
        "title": title,
        "description": description,
        "date": date,
        "read_time": read_time,
    }


def _first_sentence_or_truncate(text: str, max_chars: int) -> str:
    if not text:
        return ""
    # Prefer the first full sentence if it fits the cap. Skip false boundaries
    # like "$2.75" — only count a sentence end if the period is followed by
    # whitespace AND the next char is a capital letter or end-of-string.
    for m in re.finditer(r"\.(\s)", text):
        next_idx = m.end()
        if next_idx >= len(text) or text[next_idx].isupper():
            end = m.start() + 1  # include the period
            if end <= max_chars:
                return text[:end]
            break
    # Otherwise hard-truncate on a word boundary.
    if len(text) <= max_chars:
        return text
    cut = text.rfind(" ", 0, max_chars - 3)  # leave room for the ellipsis
    if cut <= 0:
        cut = max_chars - 3
    return text[:cut].rstrip(",;:.") + "..."


def render_card(article: dict) -> str:
    """Render a single Lab spotlight card."""
    date_html = html.escape(article["date"])
    rt_html = html.escape(article["read_time"])
    meta_line = " &middot; ".join(p for p in [date_html, rt_html] if p)
    return (
        f'      <a href="/the-lab/{article["slug"]}" '
        f'data-analytics="lab-spotlight-{article["slug"]}" '
        f'style="display:block;padding:24px;border:1px solid rgba(200,130,60,0.15);'
        f'border-radius:4px;text-decoration:none;transition:border-color 0.15s;background:#111;">\n'
        f'        <div style="font-family:\'DM Mono\',monospace;font-size:9px;'
        f'letter-spacing:0.16em;text-transform:uppercase;color:#C8823C;margin-bottom:12px;">'
        f'{meta_line}</div>\n'
        f'        <div style="font-size:17px;font-weight:500;letter-spacing:-0.015em;'
        f'color:#F0EBE4;line-height:1.35;margin-bottom:10px;">'
        f'{html.escape(article["title"])}</div>\n'
        f'        <div style="font-size:13px;color:rgba(240,235,228,0.55);line-height:1.6;">'
        f'{html.escape(article["description"])}</div>\n'
        f'      </a>'
    )


def build_spotlight_block(articles: List[dict]) -> str:
    cards = "\n".join(render_card(a) for a in articles)
    return (
        f"{START_MARKER}\n"
        f"      <!-- Populated by scripts/build_lab_spotlight.py. Do not edit by hand. "
        f"Run the script after publishing a new article. -->\n"
        f"{cards}\n"
        f"      {END_MARKER}"
    )


def main() -> None:
    # ARTICLES is in chronological order in build_feed.py. The newest 3 sit at the tail.
    latest = list(reversed(ARTICLES))[:3]
    extracted = [extract_article_meta(slug) for slug, _date in latest]
    extracted = [a for a in extracted if a]

    if not extracted:
        raise SystemExit("No articles could be extracted. Check ARTICLES + the-lab/ directory.")

    spotlight = build_spotlight_block(extracted)

    index_text = INDEX_PATH.read_text(encoding="utf-8")
    pattern = re.compile(
        re.escape(START_MARKER) + r".*?" + re.escape(END_MARKER),
        re.DOTALL,
    )
    if not pattern.search(index_text):
        raise SystemExit(
            f"Spotlight markers not found in {INDEX_PATH}. "
            f"Expected {START_MARKER} ... {END_MARKER}"
        )
    new_text = pattern.sub(spotlight, index_text)
    INDEX_PATH.write_text(new_text, encoding="utf-8")
    print(f"Wrote {INDEX_PATH} with {len(extracted)} spotlight cards:")
    for a in extracted:
        print(f"  - {a['slug']}")
        print(f"      title: {a['title']!r}")
        print(f"      meta:  {a['date']} | {a['read_time']}")
        print(f"      desc:  {a['description'][:80]}{'...' if len(a['description']) > 80 else ''}")


if __name__ == "__main__":
    main()
