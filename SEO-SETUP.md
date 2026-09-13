# V3 homepage SEO setup

## Implemented locally (not deployed)

- `index-badge.html`: descriptive title/meta description, canonical `https://xyhan.com/`, Open Graph/Twitter cards, `Person` + `ProfilePage` + 18-item `ItemList` JSON-LD.
- All 18 project links and tags are present in the initial HTML, not just JavaScript. Interactive topic/journey rendering replaces them after successful data loading. They remain usable with JavaScript disabled or gallery fetch failure.
- `assets/images/og-badge.png`: 1200×630 social preview, made from the local public portrait and confirmed identity copy. No private résumé content.
- `robots.txt`: permits crawling and declares the sitemap.
- `sitemap.xml`: homepage + 18 canonical public project pages. No invented last-modified dates and no preview/demo URLs. All 18 project URLs—including the 16 legacy routes—returned HTTP 200 in the pre-publication check.
- `llms.txt`: public profile summary and project index. This is optional AI discovery guidance, not a recognized ranking factor or guarantee an assistant can browse the site. No private correspondence or résumé text.

Regenerate metadata and project indexes after changing `content/gallery.json`:

```sh
python3 scripts/build-badge-seo.py
```

This command never deploys. The generated blocks in `index-badge.html` are marked with BADGE SEO / BADGE STATIC WORK comments. Keep identity copy consistent with the visible card. No employer is asserted as current employment.

## Publication gate

This worktree has no root `index.html`. The canonical URL deliberately represents the intended final homepage, not the private Tailscale preview. Do not submit this worktree's URL or sitemap to search engines.

After the owner approves publishing:

1. Integrate the badge entry point as the real `/` homepage without deleting the current live case-study pages or unrelated demos. Publish the referenced CSS/JS/assets and these SEO text/XML files together.
2. Verify real HTTP status and content types at `/`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and `/assets/images/og-badge.png`. Prior live robots/sitemap/llms fetches returned GitHub Pages not-found HTML, not working configuration.
3. Validate live structured data and social previews. Canonical does not force indexing or a particular search snippet.
4. Verify ownership in Google Search Console and Bing Webmaster Tools, then submit `https://xyhan.com/sitemap.xml`. Owner account/DNS approval is required; no account verification or submission has been performed.

No keyword stuffing, invented ratings, search traffic promises or hidden SEO-only prose. Existing individual project metadata has not been rewritten; this task covers the V3 homepage and crawl entry points.

## AI handoff

Removed the default “Read the question” disclosure. Provider links and Copy remain. A manual text field appears only if both Clipboard API and legacy copy fail. Gemini has no verified prefill endpoint: open Gemini and paste the copied question, rather than claiming a prefilled conversation. The prompt still starts from the currently published homepage; do not make the not-yet-published llms.txt a required first step.
