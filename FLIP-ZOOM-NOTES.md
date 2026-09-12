# Project cards → detail: Flip + Zoom

## Approved interaction

One activation on a real project opens its existing detail URL. The intermediate preview and second Enter button are removed. The identity Badge and its material/motion remain unchanged.

The card rotates around its vertical axis while expanding over ~620ms. Its front retains the original image ratio; the detail surface behind it scales uniformly, so neither images nor typography stretch. The source page navigates only after the expanded detail surface settles; the destination does not run a second arrival animation.

Closing a detail restores the homepage scroll/menu state first, then folds the detail viewport back into the originating card. Next project retains the original return target. A header-time return cover avoids showing the homepage boot sequence between the two states.

## Architecture

- `js/project-flip.js` + `style/project-flip.css`: bounded, visual-only top-layer transition. No iframe, measurement frame, injected script execution, SPA routing or duplicate active detail page. Real case URLs and independent document scrolling remain intact.
- `js/project-detail-hero.js`: shared data binding for the exact Hero/header markup used by the transition and the real detail renderer. Full-resolution `hero` media stays canonical; the source face uses `thumb`.
- `js/badge-navigation.js`: owns tab-local scroll/chapter/menu snapshots, optional source kind/input modality, direct opening and return coordination. Modifier/middle clicks stay uncanceled.
- `js/badge-scene-interaction.js`: native project links now navigate directly; no preview DOM or Enter control.
- `js/badge-scene-runtime.js`: renders the selected-image exclusion once, then pauses redundant WebGL painting beneath the short DOM transition. The normal timeline and pointer camera resume on completion/cancel.
- `index-badge.html`, `project-scrollcarousel.html`: load the shared transition and Hero modules. Detail CSS/tokens are scoped to `.scc-detail-page` / `.scrollcarousel-page` and do not change the homepage compositions.
- `js/scrollcarousel-detail.js`: retains both body templates and the existing Markdown renderer; binds Hero content through the shared helper.
- `style/badge-scene.css`, `style/scrollcarousel-detail.css`: obsolete preview/image-flight styles removed.
- `FEATURES.md`: replaces the prior preview/no-zoom contract with the approved one-step flip behavior. `MOBILE-PILOT-NOTES.md` points to this newer interaction.

## Safety and accessibility

- Preparation has a 900ms budget; missing/slow assets fall through to ordinary navigation.
- Reduced motion, unsupported effects, text-only links and missing/offscreen source rectangles use ordinary navigation.
- The temporary surface is inert and hidden from accessibility; a native dialog announces the short transition, holds Tab locally and supports Escape cancellation. Keyboard entry exposes the detail close control; return restores source focus. Pointer return does not manufacture a keyboard focus ring; keyboard input restores the normal focus treatment.
- Resize during animation, motion preference changes, duplicate activation, navigation/storage failure, pagehide and bfcache are handled without leaving temporary scroll locks or invisible overlays. A 1.8s navigation guard and 3.5s return guard fail open.
- Menu locks remain menu-owned. Return snapshot content is local DOM only, stripped of scripts/embeds/event attributes and bounded in size/time. Desktop sticky chapter headings are frozen at their visible positions for deep-detail return.

## Validation

Passed in local headless Chrome with software WebGL:

- `scripts/badge-flip-check.cjs`: desktop + mobile forward/reverse animation; keyboard activation/focus; both templates; deep close; cancellation; archive modal/scroll restoration; modified-click handling; resize/reduced-motion interruption; Next project preserving the original card; storage denial; failed preparation; browser Back; all 16 declared full-resolution Heroes and template identities.
- `scripts/badge-scene-check.cjs`: original desktop compositions/rhythm/resize, opening/identity Badge, chapter navigation, both case templates, directory return, Ask AI, résumé print/read/drag/save/replay, reduced-motion and WebGL/image-failure fallback. Updated only the superseded preview/no-zoom assertions.
- `scripts/badge-mobile-pilot-check.cjs`: 390×844, 375×667, 320×568 and 700×600; all four first-chapter cards now exercise direct detail entry and return, alongside layout/native-touch/reverse/resize checks.
- JavaScript syntax and whitespace checks.

A phone-sized recording was visually reviewed for the flip, full-detail handoff and reverse close. This is not iPhone Safari or real-device frame-rate acceptance. Test the live page on the phone next; mobile right-hand navigation and the other chapters' art direction were not changed in this task.
