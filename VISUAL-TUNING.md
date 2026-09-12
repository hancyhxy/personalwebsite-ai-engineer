# Badge Portfolio Visual Tuning

Adjust these values without changing animation or interaction logic. After editing, hard-refresh `index-badge.html`.

## Identity badge — `style/badge-hero.css`

| Variable | Default | Effect |
|---|---:|---|
| `--badge-tilt-x` | `6deg` | maximum pointer-driven vertical tilt |
| `--badge-tilt-y` | `9deg` | maximum pointer-driven horizontal tilt |
| `--badge-drag-x` | `9deg` | maximum vertical drag rotation |
| `--badge-drag-y` | `11deg` | maximum horizontal drag rotation |
| `--badge-hover-scale` | `1.022` | hover lift/scale |
| `--badge-glare-max` | `.36` | strongest neutral glare opacity |
| `--badge-spring-stiffness` | `180` | higher values react faster |
| `--badge-spring-damping` | `20` | lower values create more bounce |

## Opening image field — `style/badge-opening.css`

`js/badge-opening.js` measures these once per layout and passes them into the perspective engine. Real artwork ratios are locked at 16:9 in the scene geometry; do not tune width and height separately.

| Variable | Default | Effect |
|---|---:|---|
| `--opening-thumb-width` | `140` | maximum opening thumbnail width in CSS pixels; composition/viewport may reduce it |
| `--opening-stack-span` | `.09` | width of the initial central stack relative to viewport |
| `--opening-stack-amplitude` | `.035` | initial stack’s vertical sine amplitude |
| `--opening-wave-amplitude` | `.11` | maximum sine amplitude relative to viewport height; also capped at .20 of ribbon span |
| `--opening-wave-offset` | `.04` | ribbon vertical position relative to viewport |

Opening thumbnails retain one shared size through stack, wave, and hold. During dispersal, position and proportional scale share the same eased progress and reach their final scene values simultaneously.

## Selected Work — perspective scene modules

- `js/badge-scene-config.js`: each chapter spans `1.2` viewport units, group blend window `±.18`, endpoint allowance `.35`. Visual scene opacity now fades after the last reading interval (3.14) through 3.60 so the incoming résumé is not covered by canvas content. Total narrative travel is **3.95 viewports**, including a **.60-viewport overlap with the badge exit**. The physical section is 3.35 viewports, so the next section starts exactly at the narrative endpoint, with no extra empty screen. Chapter order is Independent → UX → Experimental, with descending years inside each chapter. There are no per-project beats or separate introduction screens.
- `SCROLLCAROUSEL_PROJECTS`: `section` assigns UX / Independent / Experimental; `sceneFeatured:false` keeps a project in the archive without removing or renumbering it. The three groups contain 4 / 4 / 3 selections. Only those 11 thumbnails appear in the opening and WebGL field.
- `B.motion.desktop = .70`: average chapter travel, not a constant frame-by-frame speed. `B.presentationTravel()` remaps physical scroll once for every real image and chapter heading. With `rhythmStrength:.86`, the derivative is .14 at overview centers and 1.86 at boundaries: about .10 vs 1.30 CSS px per physical scroll px. Around an overview, 200px of scrolling moves the composition roughly 25px rather than 140px.
- `B.motion.rhythmStrength` controls the reading beat: 0 restores uniform movement; .86 is the current strong-but-continuous slowdown. It is clamped below 1 so the mapping never stalls or reverses. All group starts/centers/ends and the scene endpoint remain unchanged. The exit polynomial joins the final boundary's speed to normal document flow without an extra spacer.
- `B.worldTravel()` converts once using camera Z `4.6` and near depth `-.08`. Decorative planes deliberately retain physical travel and slower depth-based motion while the main composition settles. The narrow-screen decorative setting `.98` remains; mobile visual art direction is still deferred.
- `B.chapterTransform()`: one physical-scroll-derived transform for every image, chapter heading and label in a group. `chapterInScale:.84` grows to 1 by `center − readingHalfWidth`; scale stays 1 through `center + readingHalfWidth` (`readingHalfWidth:.14`), then grows toward `chapterOutScale:1.12` while exiting. The common composition center scales card positions as well as dimensions; do not add independent per-card animation timers. Translation retains the global rhythmic `motionTravel`.
- `B.protectReading()`: smooth horizontal exclusion for decorative planes only. All real projects use authored, vertically separated lanes at one base depth, including across chapter boundaries; never steer them sideways. Heading exclusion bounds include the chapter's scale.
- `js/badge-scene-camera.js`: FOV `45`, Z `5 → 4.6`, spring stiffness `100`, damping `30`. Camera motion is `.08 → .20` world units in `badge-scene-runtime.js`.
- `js/badge-scene-field.js`: `slots` defines each chapter's composition. UX / Independent occupy rows at `.20h / .78h`; Experimental has a larger upper-center Power Station and two smaller lower images. Normal image width is capped at `.36h`, Power Station at `.44h`. All groups keep base Z `-.08` while their whole composition follows the shared chapter zoom; historical/future opacity blends to `.16`, current overview to `1`. The 1.2-viewport chapter spacing leaves clearance between outgoing lower rows and incoming upper rows. The first screen has no visible project or decorative planes.
- `js/badge-scene-background.js`: 40 desktop / 20 mobile allocated instances, depth layers and recycling interval. Only some instances are visible at once; these are texture-free rectangles, never clickable work.
- `js/badge-scene-reading.js`: owns three HTML chapter headings, not individual featured-image figures. At each overview center, text starts at `38vh` (UX / Independent) or `39vh` (Experimental); it moves with scroll but not with the pointer. Images remain in WebGL. Native links and small labels track their projected rectangles.
- `js/badge-scene-scroll.js`: Lenis wheel duration `1.05`, native touch (`syncTouch:false`), ScrollTrigger linear physical progress. Navigation, resizing, return snapshots and progress bars use this uneased value; only scene presentation uses the rhythm mapping. Do not add a second smooth-scroll lerp or snap.

The old `badge-webgl.js`, `badge-scroll-stage.js` and their CSS are not loaded by the Badge entry. Their tokens no longer tune the active scene.

## Opening type — `style/badge-opening.css`

| Variable | Default | Effect |
|---|---:|---|
| `--opening-role-top` | `46%` | vertical center shared by `AI / Engineer` and the ribbon |
| `--opening-role-size` | `clamp(26px,6.6vw,104px)` | desktop role title size; measured words together are capped at 43% of composition budget |
| `--opening-ai-left` | `8%` | pre-measure fallback only; JS lays out the final combination |
| `--opening-engineer-right` | `7%` | pre-measure fallback only; JS lays out the final combination |

`layoutComposition()` measures max-content word widths: overall budget `min(90vw,1280px)`, gap `min(28px,2.2vw)`, picture-center span at most 3.8 thumbnail widths. The 11 positions are sampled at equal curve arc lengths to avoid piles at the crests and gaps on slopes. Change the whole composition, not the image ratio.

## Portfolio menu

- `js/badge-menu.js` / `style/badge-menu.css`: 44px upper-right hamburger, visibility driven by the same docked-name alpha. Native modal with explicit Tab cycling; Escape restores page position/focus and releases scroll. Header close button occupies the same location as the launcher.
- Move the existing `#work-next` section into All Projects, without cloning projects or adding page height. `js/badge-work.js` keeps both directory layouts quiet and complete; `.portfolio-menu-scroll[data-lenis-prevent]` owns modal scrolling. No thumbnail flight effects.
- `js/badge-navigation.js` stores the directory view, sort and internal scroll alongside physical page/scene position. Restore page position first, then open/lock the menu and restore its scroll/focus.
- Résumé has a full-width opaque paper background and no top rule. The printer itself remains unchanged.
- Run `scripts/badge-menu-check.cjs` for desktop/mobile/reduced-motion navigation, sorting, wheel isolation, focus cycling, detail/Next return, failure recovery and résumé handoff.

## Identity exit and scroll guides

- `js/badge-scroll-chrome.js` / `style/badge-scroll-chrome.css`: one native-scroll-derived update controls the existing masthead link, outer `.badge-stage`, right capsule and bottom chapter progress. It does not create another scroll smoother.
- Two stationary names crossfade: centered name fades over `0–.18h`; upper-left name appears over `.08–.24h`, with a 28px desktop / 18px mobile left margin. No horizontal translation between them.
- Badge stage uses an outer upward arc (`+.20 × scrollY − .06h × push²` offset against native scroll), fades over `.12–.82h`, and grows from 1 to `1.14` over `.80h` using cubic ease-out: early forward push, then gentle settling. The inner badge keeps its independent pointer spring. No pinning or extra spacer.
- `heroOverlap:.6` in scene timing starts Selected Work .60 viewport before its physical section top. Entry visibility starts no earlier than `.15h` of page scroll; real images and decorations remain fully hidden at the resting hero. Their vertical trajectory continues below the viewport before the chapter trigger, rather than fading a stationary collage into the badge.
- Right capsule: whole-page progress and three chapter links. Bottom: one continuous Selected Work progress axis with fixed 2026 → 2018 endpoints (the full featured year range), never resetting between chapters or pretending to show a current project/year. Guides are absent during opening and bottom guide outside Selected Work. The bottom fill completes at the final overview center (physical travel 3.0); opacity fades as the résumé's top passes .98 → .91 viewport, then hides. It never overlays the printer.
- Reduced motion keeps the identity unscaled/unfaded and derives guide state from fallback HTML sections. The two names switch without interpolation.

## Selected Work typography — `style/badge-scene.css`

Use `.scene-overview-heading`, `.scene-keywords`, `.scene-chapter-line`, and `.scene-project-label`. The header keeps its chapter-level hierarchy; it does not shrink to make room for individual projects. Font sizes are capped by both viewport width and height to protect the surrounding images.

Chapter summaries live in `B.groups[].line`. Project names appear below their images; company/year and individual summaries remain in the click-open preview. Museum Tour adds its concept-proposal note. Do not restore a white veil, chapter fractions or `.scene-featured` reading frames. The résumé identity line retains its existing smaller scale independently.

## Opening timing — `js/badge-opening.js`

Edit the defaults in the `timing` object. All values are seconds.

| Key | Default | Effect |
|---|---:|---|
| `stackReveal` | `.24` | thumbnail stack fade-in |
| `waveStart` | `.4` | when sine expansion starts |
| `waveDuration` | `1.3` | sine expansion duration |
| `settleDuration` | `.28` | gentle settling after expansion |
| `roleStart` | `.82` | when `AI / Engineer` appears |
| `holdDuration` | `1.35` | pause after the ribbon settles |
| `gatherDuration` | `.55` | ribbon contraction into the central image cluster |
| `gatherHold` | `.08` | nearly imperceptible cluster hold before dispersal |
| `landDuration` | `1.55` | simultaneous outward/downward movement and proportional scaling into the homepage scene |

Keep `holdDuration` at or above `1.3` to preserve the locked pacing in `FEATURES.md`.
