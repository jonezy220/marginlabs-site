# scripts/

Helper scripts for the Margin Labs site.

## build_feed.py — Lab RSS feed generator

Generates `the-lab/feed.xml` from the article HTML files in `the-lab/`.
Each item carries the full article body via `<content:encoded>` so
Substack's RSS importer pulls complete posts, not stubs.

Each post in the feed includes:
- Full article body (extracted from `<div class="article-body">`)
- End-of-article CTA section
- Source-attribution note at the bottom linking to the marginlabs.io original
- All internal links rewritten to absolute marginlabs.io URLs with
  `utm_source=substack&utm_medium=newsletter&utm_campaign=lab`
- CSS variables replaced with hex fallbacks so styles render off-site

### When to re-run

After publishing a new Lab article, or after editing an existing one.

### Workflow

1. Add the slug + ISO publication date to the `ARTICLES` list in
   `build_feed.py`. Pick a date inside the article's stated month so the
   feed ordering matches the Lab index.
2. Regenerate and deploy:

   ```bash
   python3 scripts/build_feed.py
   git add scripts/build_feed.py the-lab/feed.xml
   git commit -m "Add Lab article: <slug>"
   git push
   ```

   Vercel auto-deploys; the live feed updates within ~30 seconds.

3. Push the change to Substack:
   - Open <https://marginlabs.substack.com/publish/import>
   - Paste `https://marginlabs.io/the-lab/feed.xml`
   - Click **Get started**
   - Tick **Update existing posts** (so existing slugs get refreshed
     content; otherwise re-imports do nothing for posts already pulled)
   - Click **Import**, confirm ownership, click **Next**

### Known limitations

Substack has no per-post canonical URL field on the free tier. All
imported posts self-canonicalize to `marginlabs.substack.com`. The
bottom-of-post link to the marginlabs.io original is a soft signal —
not a true `rel="canonical"` — so duplicate-content risk is non-zero.

### Article HTML requirements

The script extracts content with anchor patterns specific to the Lab
article template. Each article HTML must contain:

- `<title>...</title>` (the " | Margin Labs" suffix is stripped automatically)
- `<meta name="description" content="...">`
- `<link rel="canonical" href="https://marginlabs.io/the-lab/{slug}">`
- `<div class="article-body">...</div>` followed by
  `<a href="/the-lab/" class="article-back">`
- An `<!-- ── END-OF-ARTICLE CTA ... -->` comment followed by a
  `<section>...</section>` block

If a new article ships and the script throws `article-body not found`
or `end-of-article CTA not found`, check that the new file matches
this template.

## brevo-setup.js

Brevo CRM/automation setup script — see file header for details.
