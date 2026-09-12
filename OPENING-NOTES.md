# Xinyi Han opening — V3 badge

Reference: https://www.getty.edu/tracingart/ (not the Getty database/search page).
Confirmed sequence: Xinyi Han centered → 11 curated project images form a curved ribbon → ribbon contracts into a compact central image cluster → images disperse outward and downward → existing identity card appears in the cleared center.

Implementation: `js/badge-opening.js`, `style/badge-opening.css`, and the persistent perspective engine in `js/badge-scene-*.js`, with one bounded pre-paint lifecycle gate in `index-badge.html`. The 11 selected local thumbnails come from canonical `SCROLLCAROUSEL_PROJECTS`; five archive-only entries retain their original detail indices but do not render in the opening or field. Opening and scene share mesh identities and 16:9 projection geometry. The original HTML badge and résumé modules are retained.

Timing after bounded image preparation: stack reveal 240ms; ribbon expansion 1300ms plus 280ms settle; completed composition holds 1350ms; contraction takes 550ms; outward/downward dispersal and proportional scaling share one 1550ms eased transition, reaching final position and size together with no post-arrival resize. Texture-free decorative instances are excluded from the ribbon and fade in during dispersal. There are no duplicate clickable scene meshes. Hard fail-open uses one shared gate; runtime errors also settle the opening and expose grouped HTML. No fake loading percentage.

The opening is an arrival treatment, not a generic load animation. It runs only for the first fresh, top-of-page homepage navigation in a tab session. A sessionStorage marker suppresses reloads and repeat homepage visits; navigation type suppresses reload/history traversal; detail returns and hash deep links remain bypassed. After `pageshow`, two paint frames verify the browser-restored scroll position before the timeline starts, so a non-top restoration immediately clears the overlay without moving the user.

Skip intro / Escape, reduced-motion, resize cancellation, failed-data cleanup and hash deep-link bypass are supported. Main/header/footer become inert only during the overlay and are restored afterward. Original card dragging, résumé printer and single AI entry remain unchanged.

Checks: `scripts/badge-scene-check.cjs` validates the full opening per frame (16:9, equal position/size progress, final bounds error under 1 CSS px), skip/focus restoration, perspective pointer behavior, three-group overview continuity, simultaneous 4/4/3 selections, all 16 archive/detail routes, desktop layouts, reduced-motion and failure paths. Mobile visual optimization is deferred; only its functional access is checked. It also checks both detail templates and the existing résumé read/drag/save/replay flow. No publication.
