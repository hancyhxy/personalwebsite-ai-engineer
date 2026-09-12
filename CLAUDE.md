# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Before changing the Badge portfolio flow, immersive Selected Work scene, résumé integration, Ask AI, or project-detail pages, read [`FEATURES.md`](FEATURES.md) and validate every affected Locked behavior.

## Running the site

No build tooling. Plain HTML/CSS/JS. Serve over HTTP:

```bash
cd /path/to/personalwebsite-v2
python3 -m http.server 8000
# open http://127.0.0.1:8000/index-stickies.html  (or any other index-*.html)
```

**`file://` will not work** for most themes — `js/component-loader.js` uses `fetch()` to inject the shared header/footer, and gallery-driven themes use `fetch('./content/gallery.json')`. Both need the HTTP scheme.

There are no tests, linters, or CI configured.

## Architecture

### Six themes, six entry points

Each `index-<theme>.html` at the repo root is a self-contained visual treatment of the same portfolio content. There is no routing and no "main" index — you pick the theme in the URL. Current themes:

| Theme    | Entry                    | Body class       |
|----------|--------------------------|------------------|
| Journal  | `index-journal.html`     | `.journal-page`  |
| Polaroid | `index-polaroid.html`    | *(none)*         |
| Retro    | `index-retro.html`       | `.retro-desktop` |
| Stickies | `index-stickies.html`    | `.stickies-page` |
| Studio   | `index-studio.html`      | `.studio-page`   |
| Vinyl    | `index-vinyl.html`       | `.vinyl-page`    |

### Per-theme CSS + JS isolation (the rule for new themes)

- **CSS** lives in `style/<theme>-*.css` and scopes every rule under the theme's body class (except Polaroid). Theme-specific design tokens go in `style/<theme>-tokens.css` so they don't leak between themes. `style/variables.css` is only for genuinely shared tokens.
- **JS** lives in `js/<theme>-*.js`, typically split as `<theme>-wall.js` (rendering) + `<theme>-app.js` (boot/glue) + optional `<theme>-card.js` / `<theme>-templates.js`. Retro deviates — it has only `js/desktop-app.js`.
- Fonts are loaded inline in each `index-*.html` and are theme-specific. Don't consolidate.

### Content sources

- **`content/gallery.json`** — canonical project list. All themes *except Studio* `fetch()` it at boot and render from it. This is the source of truth for the shared themes.
- **`content/projects/<slug>/text.md`** — long-form case-study copy, loaded into case panels when a project is opened.
- **`js/studio-projects.js`** — Studio's own project data, inlined because Studio needs extra per-project fields (pin coords, discipline, hand-written notes) that `gallery.json`'s schema doesn't carry. When adding a theme that needs a different shape, add a new data file alongside rather than widening `gallery.json`.

### Image conventions

- **Thumbnails**: `assets/images/thumbs/<project-slug>-thumb.jpg`. Slug = `gallery.json` project name, lowercased, spaces → hyphens, parens stripped.
- **Full-size case-study images**: `assets/images/<slug>/…`. Not used for tile/thumb rendering.

### Shared header/footer loader

`js/component-loader.js` is used by Polaroid / Retro / Vinyl / Stickies / Journal. It fetches `components/header.html` and `components/footer.html`, replaces `{{HOME_LINK}}`, `{{CONTACT_LINK}}`, `{{RESUME_LINK}}` placeholders, and auto-adjusts `../../` paths when served from `/projects/<slug>/` subpages.

**Studio does not use `component-loader.js`** — its masthead and footer are inline in `index-studio.html`.

The top-level `projects/` directory and the `/projects/` branch inside `component-loader.js` are **future-facing** — no per-project subpages exist yet.

## Adding a project

1. Append an entry to `content/gallery.json`.
2. Drop a thumbnail at `assets/images/thumbs/<slug>-thumb.jpg`.
3. Add `content/projects/<slug>/text.md` for the case-study copy.

All shared themes (everything except Studio) pick it up automatically. For Studio, also add an entry to `js/studio-projects.js`.
