#!/usr/bin/env python3
"""
build_nav.py — single-source navigation cascade for the Margin Labs site.

Edit NAV_LINKS below once, run this script, and every .html file's desktop
and mobile nav is rewritten to match. Replaces the old "change it in 51
places by hand" workflow.

What it touches (nothing else in the file):
  - the inner <li> list of  <ul class="nav-links" role="list"> ... </ul>   (desktop)
  - the inner <li> list of  <div class="nav-mobile" ...><ul> ... </ul>     (mobile)

Usage:
  python3 scripts/build_nav.py            # apply to all *.html
  python3 scripts/build_nav.py --check    # report drift, change nothing (exit 1 if drift)

Run from anywhere; paths resolve relative to the repo root (this file's parent's parent).
"""
import re
import sys
import glob
import os

# ── SINGLE SOURCE OF TRUTH ──────────────────────────────────────────────
# (label, href, data-analytics). Order = display order.
NAV_LINKS = [
    ("Margin Multiplier", "/margin-multiplier", "nav-multiplier"),
    ("The Framework",     "/framework",         "nav-framework"),
    ("Advisory",          "/advisory",          "nav-advisory"),
    ("The Lab",           "/the-lab/",          "nav-the-lab"),
    ("Principal",         "/principal",         "nav-principal"),
]

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DESKTOP_INDENT = "      "  # inside <ul class="nav-links">
MOBILE_INDENT  = "    "    # inside <div class="nav-mobile"><ul>


def _li_block(indent):
    return "\n".join(
        f'{indent}<li><a href="{href}" data-analytics="{da}">{label}</a></li>'
        for label, href, da in NAV_LINKS
    )


def build(check_only=False):
    desktop_inner = "\n" + _li_block(DESKTOP_INDENT) + "\n    "
    mobile_inner  = "\n" + _li_block(MOBILE_INDENT) + "\n  "

    desktop_re = re.compile(r'(<ul class="nav-links" role="list">)(.*?)(</ul>)', re.S)
    mobile_re  = re.compile(r'(<div class="nav-mobile"[^>]*>\s*<ul>)(.*?)(</ul>)', re.S)

    files = sorted(glob.glob(os.path.join(REPO_ROOT, "**", "*.html"), recursive=True))
    changed, drift = [], []

    for f in files:
        s = open(f, encoding="utf-8").read()
        orig = s
        s, nd = desktop_re.subn(lambda m: m.group(1) + desktop_inner + m.group(3), s)
        s, nm = mobile_re.subn(lambda m: m.group(1) + mobile_inner + m.group(3), s)
        if nd == 0 and nm == 0:
            continue  # no nav on this page (e.g. email templates)
        rel = os.path.relpath(f, REPO_ROOT)
        if s != orig:
            drift.append(rel)
            if not check_only:
                open(f, "w", encoding="utf-8").write(s)
                changed.append(rel)

    if check_only:
        if drift:
            print(f"DRIFT in {len(drift)} file(s):")
            for r in drift:
                print("  " + r)
            return 1
        print(f"OK — nav in sync across all files ({len(files)} scanned).")
        return 0

    print(f"Nav cascade applied. {len(changed)} file(s) updated:")
    for r in changed:
        print("  " + r)
    if not changed:
        print("  (all files already in sync)")
    return 0


if __name__ == "__main__":
    sys.exit(build(check_only="--check" in sys.argv))
