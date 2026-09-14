# Mobile reading layout and tilt interaction

The Independent Work-only pilot is superseded by the native layout for all three chapters (≤700px). `FEATURES.md` is the active behavior contract. The historical `badge-mobile-pilot-check.cjs` filename remains the mobile regression entry point.

## Reading layout

- Reuse the existing semantic HTML project links for 4 Independent / 4 UX / 3 Experimental selections, rather than generating another project list.
- Left-aligned chapter title, tags and summary; consistent full-width 16:9 images and captions. Minimum 20px side margins, 32px introduction clearance, 36px project gaps, 64px chapter gaps, and 88px chapter-anchor/header clearance.
- Content determines section height. No mobile perspective layout, chapter zoom, slow reading beat, Lenis or artificial multi-viewport spacer. After the opening, the canvas is hidden and continuous rendering stops; event-driven bookkeeping remains.
- Height-only resizing never calls the scene driver's scrollTo. Native browser anchoring may adjust document scrollY to keep content visually stationary when preceding content changes size. Width-class changes preserve chapter-relative position and restore desktop compositions.
- The mobile header has an opaque backing so preceding chapter captions cannot overlap the name. The right floating rail is hidden; menu chapter navigation remains. The bottom axis stays near the safe area and the 48px dog-only launcher yields upward while it is visible.
- All 18 project links remain in the complete directory. The normal mobile story shows 11; reduced-motion/WebGL failure fallback shows all 18. Concept-proposal labeling remains visible for Museum Tour.

## Automatic phone tilt with permission fallback

- `js/badge-tilt.js` owns permission, calibration and sensor lifecycle; `BadgePortrait` in `js/badge-hero.js` reuses the nine existing portrait images, spring, shadow and glare pipeline.
- Touch gestures no longer rotate/drag the badge; native scrolling owns them. PC mouse and keyboard input remain available.
- On a coarse-pointer phone, try automatic startup when the visible badge has browser permission. Where DeviceOrientationEvent.requestPermission exists, check once: an already-granted state may resolve without activation, while a prompt state without activation rejects. That rejection exposes Enable tilt interaction; its explicit click is the only path that can show a new permission prompt. Do not repeatedly retry or imply first-time iPhone permission can be bypassed. No sensor values, compass input or network transmission are used. Remember only an explicit off choice in sessionStorage, so reload does not undo the user's choice.
- Permission/activation reference: https://www.w3.org/TR/orientation-event/#deviceorientation
- First valid beta/gamma sample establishes a comfortable-grip baseline. Screen orientation remaps axes; a 3-degree dead zone and bounded input limit movement. Recenter and Turn off tilt remain available.
- Offscreen/hidden/unfocused states remove the sensor listener, return to neutral, and recalibrate on resumption. Reduced motion disables the feature. Permission denial/errors, insecure or unsupported devices, and missing orientation data leave normal browsing intact with an explanatory status.

## Validation

Passed locally with headless Chromium, software WebGL and synthetic orientation input:

- `scripts/badge-mobile-pilot-check.cjs`: 390×844, 375×667, 320×568, 700×700; consistent geometry, exact native 1:1 displacement, chapter navigation, three touch detail/return paths, native resize anchoring, desktop/mobile restoration, reduced motion and WebGL loss.
- `scripts/badge-mobile-agent-check.cjs`: mobile/desktop boundaries, icon sizing, panel opening/closing and viewport fit, axis avoidance, reverse scroll and reduced motion.
- `scripts/badge-tilt-check.cjs`: automatic startup with existing permission and without a permission API, first-time prompt rejection followed by explicit authorization, all nine directions, dead zone, bounded spring response, calibration, screen rotation, pause/resume, session-remembered disable, denial/rejection, reduced motion, missing data, unsupported and insecure contexts.
- `scripts/badge-scene-check.cjs`: desktop compositions/rhythm/pointer, keyboard, detail templates/return, complete directory, Ask AI, printer reading/drag/print/download/replay, opening and reload behavior, failure fallbacks.

These are not real-device Safari performance or physical sensor acceptance. Verify on an HTTPS iPhone preview before publishing: permission dialog, comfortable neutral grip, tilt direction/sign, Safari toolbar movement, touch scrolling over the badge, and return from a project. No deployment was performed.
