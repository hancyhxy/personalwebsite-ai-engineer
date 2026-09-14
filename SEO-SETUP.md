# V3 homepage SEO setup

## SEO surfaces

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

This command never deploys. The generated blocks in both `index-badge.html` and the published entry `index.html` are marked with BADGE SEO / BADGE STATIC WORK comments. Only these blocks are synchronized; other entry-page changes are preserved. Recruiter guidance is authored in `content/recruiter-guide.md` and included in `llms.txt` before the full project index. Keep identity copy consistent with the visible card. No employer is asserted as current employment.

## Publication gate

The current deployment is `https://xyhan.com/`, backed by the root `index.html`. Live checks on 2026-09-15 confirmed the old GitHub Pages URL remained in `js/badge-agent.js`; `/llms.txt` and `/robots.txt` were readable. The recruiter changes below are local until published. Never submit local or private preview URLs to search engines.

After the owner approves publishing:

1. Integrate the badge entry point as the real `/` homepage without deleting the current live case-study pages or unrelated demos. Publish the referenced CSS/JS/assets and these SEO text/XML files together.
2. Verify real HTTP status and content types at `/`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and `/assets/images/og-badge.png`. Prior live robots/sitemap/llms fetches returned GitHub Pages not-found HTML, not working configuration.
3. Validate live structured data and social previews. Canonical does not force indexing or a particular search snippet.
4. Verify ownership in Google Search Console and Bing Webmaster Tools, then submit `https://xyhan.com/sitemap.xml`. Owner account/DNS approval is required; no account verification or submission has been performed.

No keyword stuffing, invented ratings, search traffic promises or hidden SEO-only prose. Existing individual project metadata has not been rewritten; this task covers the V3 homepage and crawl entry points.

## AI handoff

One prompt in `js/badge-agent.js` drives ChatGPT, Claude, Copy and Gemini's clipboard handoff. It starts at `https://xyhan.com/`, optionally reads `/llms.txt`, and asks for a sourced 30-second brief before requesting a company and role/JD. The follow-up compares up to four requirements against direct evidence, transferable experience and unknowns; it recommends two cases and three interview questions. It separates company/job sources from candidate evidence and avoids numerical fit scores or hiring verdicts.

The guide routes readers by team problem, distinguishes UX ownership from implementation and prototypes from production, and links directly to Markdown for the two JS-rendered independent cases. It contains only portfolio-derived public material, not private résumé/contact content. This improves readability and evidence discovery, not guaranteed search ranking or AI recommendations.

Provider links and Copy remain. A manual text field appears only if both Clipboard API and legacy copy fail. Gemini has no verified prefill endpoint: open Gemini and paste the copied question, rather than claiming a prefilled conversation. Provider login, browsing and query-prefill support remain outside this site's control. No prompts were submitted to external assistants during testing.

### Local validation (2026-09-15)

- `node --check js/badge-agent.js` and `git diff --check`.
- `scripts/badge-agent-prompt-check.cjs`: both entry pages, canonical domain, provider/copy parity, Gemini handler and manual-copy fallback.
- `scripts/badge-mobile-agent-check.cjs`: six desktop/mobile/reduced-motion configurations.
- `scripts/badge-scene-check.cjs`: 27 full-flow checks covering opening, badge, projects, details, résumé, Ask AI and failure fallbacks.

Run browser checks against an HTTP-served site with `BASE_URL` and optionally `PLAYWRIGHT_MODULE` / `CHROME_PATH`. Real iPhone Safari and actual provider prefill behavior still need human acceptance after deployment.
