# Independent Work — mobile pilot

## Scope

At ≤700px, Independent Work has a separately authored vertical composition. Desktop, the opening, UX Designer and Experimental Practice retain their layouts. The latter two mobile chapters are intentionally not visually accepted in this pass.

- Full chapter copy and wrapping tags precede four original-color, 16:9 artworks.
- At 390px, artwork width is approximately 296px rather than the previous 90–100px. Narrow phones reserve extra navigation clearance.
- Images alternate subtly left/right; every image and caption becomes fully visible through native scrolling. No timed advance, extraction, snap or additional smoother.
- Measured copy height protects the first image on short screens. Real images avoid the right progress rail.
- The first chapter occupies 3.6 viewport heights; total scene travel is 6.35. Other chapter durations remain 1.2. The mobile pilot trades simultaneous overview density for readable image sizes.
- The first chapter uses constant image scale and shared linear .70px/px translation. Desktop retains overview zoom and the eased reading beat.
- Decorative opacity is reduced continuously while Independent Work is active.
- The growing hero is horizontally clipped on mobile, preventing invisible overflow from widening the layout viewport and corrupting scroll coordinates.
- Chapter-relative return snapshots preserve chapter identity when the viewport class changes. Existing snapshots remain readable.

## Changed files

- `js/badge-scene-config.js`: mobile chapter timing and pilot-only transform.
- `js/badge-scene-scroll.js`: updated anchors/timeline and breakpoint progress restoration.
- `js/badge-scene-reading.js`: measured mobile copy clearance.
- `js/badge-scene-field.js`: authored mobile image lanes and sizes.
- `js/badge-scene-background.js`: quieter mobile first-chapter decoration.
- `js/badge-scene-interaction.js`: chapter identity on projected links.
- `js/badge-navigation.js`: chapter-relative detail return snapshots.
- `style/badge-scene.css`: scoped pilot typography, labels and hero overflow protection.
- `scripts/badge-mobile-pilot-check.cjs`: new mobile regression coverage.
- `FEATURES.md`: explicit mobile pilot contract and desktop-only duration qualification.

## Validation

Passed sequentially with local headless Chrome and software WebGL:

- `scripts/badge-mobile-pilot-check.cjs`: 390×844, 375×667, 320×568, 700×600. Copy/image clearance, image sizes, navigation clearance, complete image/caption visibility, projected hit bounds, four direct touch-to-detail entries and returns, native touch configuration, reverse scrolling, height/breakpoint resize, next-chapter navigation, final exit. The subsequent Flip + Zoom replaces the original preview step; see `FLIP-ZOOM-NOTES.md`.
- `scripts/badge-scene-check.cjs`: desktop 4/4/3 compositions, spatial rhythm, pointer spring, reverse/resize, keyboard navigation, both detail templates, complete directory return, Ask AI, résumé printing/download/replay, opening geometry, reduced motion, WebGL context loss and texture-failure fallback.
- JavaScript syntax and `git diff --check`.

These are browser-emulation checks, not iPhone Safari or real-device performance acceptance. Review the pilot on a phone before extending the composition to UX Designer and Experimental Practice. In particular, verify browser-toolbar resizing and the perceived amount of vertical whitespace.
