# Badge Portfolio Feature Contract

Read this file before changing `index-badge.html`, the immersive project field, résumé flow, Ask AI, or project-detail pages. Treat every **Locked** item as a regression requirement. Update this file only when the product decision changes. Use [`VISUAL-TUNING.md`](VISUAL-TUNING.md) for safe manual adjustments to size, spacing, typography, material response, and timing.

## Validation sequence

1. Preserve every Locked behavior in the affected sections.
2. Implement the requested visual or interaction change.
3. Test the full path: opening → badge → Selected Work → detail → résumé → Ask AI.
4. Test keyboard, mobile, and reduced-motion paths for every affected interaction.
5. Report any Locked item that could not be preserved.

## Canonical page flow

1. Getty-style opening
2. Interactive identity badge
3. Selected Work: Independent Work → UX Designer → Experimental Practice; newest projects first within each chapter
4. Short identity line → Download Résumé → existing résumé printer (no intervening static-index section or horizontal rules)
5. Footer
6. The upper-right menu provides chapter navigation, All Projects (complete index), Résumé and Contact; Ask AI remains available across the main page

## 00 — Opening

### Locked content

- No loading screen, loading percentage, or progress bar.
- One small centered line: `Xinyi Han`.
- No `Portfolio · Sydney` line.
- On desktop (>700px), the opening title is split as `AI` on the left and `Engineer` on the right. On mobile (≤700px), `AI` is centered above a vertical S-shaped image ribbon and `Engineer` is centered below it.

### Locked motion

1. `Xinyi Han` starts small and centered.
2. Solid project images form a compact central stack.
3. Images expand into a compact sine-wave ribbon while `Xinyi Han` moves to the exact centered first-scene/header position.
4. The completed sine ribbon settles elastically and holds with `AI / Engineer` fully visible before any dispersal begins; the name is already at the header and stays there.
5. On desktop, `AI`, the ribbon, and `Engineer` form one horizontally centered composition. The ribbon fits between the measured words with clear gaps. On mobile, title heights, header and skip-button clearance determine the vertical ribbon's available travel; the two titles and curve are centered on the viewport. Keep the image planes upright and 16:9—rotate the curve's travel axis, not the images. The same 11 unique artworks form the curve; never duplicate cards to mimic the reference's larger collection.
6. Images disperse and fade away, revealing a badge-only first screen; no three-project satellite layout remains.
7. Position and proportional size share the same eased dispersal progress; no separate post-arrival enlargement occurs.
8. The identity badge is revealed as the sole first-screen subject. The 11 projects reappear only when scrolling into Selected Work.
9. The opening plays on the first fresh, top-level homepage arrival in a tab session and on a normal or hard reload whose browser-restored position remains at the top. A reload restored below the top, repeat in-tab navigation, history traversal, detail return, hash/deep link, reduced-motion or failure path skips it without moving the user or leaving an overlay. The overlay stays hidden and non-blocking until post-`pageshow` scroll restoration confirms the top position.

### Visual contract

- Opening uses the 11 curated project images exactly once, with solid color and full opacity. The seven archive-only projects are excluded from the ribbon and scene, not deleted from the site.
- Opening images have square corners.
- Images remain horizontal or vertical rather than arbitrarily tilted.
- The sine ribbon is compact; it must not spread into a sparse full-screen diagonal.
- Every opening image uses one shared 16:9 rectangle through stack, wave, hold, and dispersal, matching the Selected Work project planes. The simultaneous dispersal-and-size transition scales these images proportionally without changing their aspect ratio or crop; texture UVs use cover cropping rather than stretching. Decorative background planes retain their varied ratios.
- The fully formed `AI / Engineer` composition holds for at least 1.3 seconds before dispersal.
- The transition into the badge scene is continuous rather than a flash cut.
- Skip and reduced-motion paths land in the same final state.

## 01 — Interactive identity badge

### Locked behavior

- The badge is the first scene’s central subject.
- While the identity badge is visible and the opening has finished, mouse movement across the whole viewport—including outside the badge and over the WebGL hit layer—drives portrait direction and restrained spring-driven `rotateX` and `rotateY` depth.
- Pointer percentage is shared by tilt, directional shadow, restrained glare, and portrait direction.
- The portrait changes among nine directional images according to pointer position.
- Keyboard direction controls remain available.
- On touch phones at ≤700px, an explicit `Enable tilt interaction` button offers local-only device-orientation input. Request iOS motion permission only from that click and only in a secure context; never auto-prompt or upload sensor values. Touch dragging no longer drives the portrait or captures native scrolling.
- Calibrate beta/gamma against the first valid sample at the current comfortable grip. Apply screen-orientation-aware axes, a 3° dead zone, bounded input and the existing portrait/spring pipeline; ignore alpha/compass heading. Keep nine-direction portrait images and subtle rotation targets (bounded at 4.5° X / 6.75° Y with default tokens, with restrained spring settling).
- Expose Turn off tilt and Recenter controls. Pause/remove sensor listeners while the badge is offscreen, the page is hidden or unfocused; re-entry recalibrates. Rotation changes also recalibrate. Reduced motion disables opt-in interaction; denial, unsupported/insecure devices and missing sensor data leave a neutral card with a readable status and normal browsing. No persisted auto-enable.
- Pointer exit from the viewport, window blur, or scrolling the badge offscreen returns the portrait and badge smoothly to neutral. Leaving the card itself does not reset the gaze.
- Alibaba and ByteDance project entries remain usable.
- `Learn more about me` scrolls to the résumé section and starts the existing printer flow.
- The settled first screen contains only the badge, with no surrounding project cards or decorative planes. All projects remain accessible in Selected Work and the static index.

### Visual contract

- Rotation stays subtle and never interferes with text legibility or clicks.
- The outer holder uses clear neutral plastic rather than frosted plastic; restrained neutral glare and reflection remain enabled so its surface and thickness stay legible.
- Material response never uses rainbow foil, card flipping, or full-screen enlargement.
- The masthead contains only `Xinyi Han`: the stationary centered version fades out over the first .18 viewport; a separate, smaller stationary upper-left version fades in over .08–.24 viewport. No sideways logo flight. Only the visible version is interactive/accessibility-exposed. No header rule, location text or registration mark.
- The badge's outer stage moves upward on a shallow arc, grows from 1 to 1.14 over .80 viewport with a cubic ease-out (decisive forward push, then settling), and fades over .12–.82 viewport. It must not shrink away. Pointer tilt stays on the inner badge. Scroll-back restores the original state.
- Selected Work starts .60 viewport before the first section's physical top, overlapping the badge exit. This lead is subtracted from the section height, not added as a spacer; do not leave a blank viewport between the badge and incoming artwork.
- Background planes appear with Selected Work, not behind the initial badge.
- Decorative background planes are never interactive.

## 02 — Selected Work

### Locked sections

The desktop narrative contains exactly three chapter overviews, in this order. Each chapter is one composition: its title, keywords, substantive chapter summary and selected projects appear together. No separate introduction screen, visible `01 / 03`, compact-title fold or automatic per-project slideshow. Omit the repeated “Selected Work” eyebrow above chapter titles. Render each chapter keyword as a separate identity-badge-style tag: monospace type, thin neutral outline, 2px corners and a restrained offset shadow; retain the same keywords and use wrapping tags in the HTML fallback too. Tags are descriptive text, not buttons.

1. **Independent Work** — AI Prototyping · Interactive Products · Content Practice. Four projects surround the summary of design, implementation and content practice: Tech Fest | AI Showcase, Claude Code ↔ Figma, Drum Kit, and AI-Assisted Video Editing Workflow. The Showcase is a concise record of Linkaroo and Anonymous Connection as exhibited working prototypes; the editing case documents a human-directed, AI-executed production workflow and real published output. Do not invent employment or results.
2. **UX Designer** — Platform Systems · Complex Workflows · Global Experiences. Four projects surround the summary of platform/UX practice, with ByteDance (2023) before Alibaba (2022, 2021); Dispatch is not the sole central subject.
3. **Experimental Practice** — Space · Objects · Play. Exactly three projects: **My Friends Are My Power Station** (larger upper-center visual), **Design Museum Tour as a Game**, **The Museum Kit**. Museum Tour is explicitly described as a concept proposal, not a deployed museum system. Parsons remains truthful project/education context, not the chapter title.

Project membership and `sceneFeatured: false` archive exclusions are declared in canonical project data. Keep all 18 entries intact, preserve the original 17 detail indices, and append new detail identities rather than renumbering old ones. FriendUp, KOL Growth Strategy, Food Memory, How Are Oscars Biased?, Solar System Relationships, Farmer Coffee Logo and Global 1M Audition are archive-only, not removed. Preserve old `#work-parsons` links as an alias for `#work-experimental`.

### Locked focus behavior

- On desktop, a single reversible timeline moves between three overview compositions (4 UX / 4 Independent / 3 Experimental), with approximately 3–4 viewport heights of total travel including exit. Mobile uses the native reading layout below. Do not add an empty extra viewport after the scene.
- All selected works in the current group appear simultaneously in original color and full opacity at the overview center. Neighboring groups remain at lower opacity and blend continuously through boundaries. Stable original indices are retained; sort within chapters by descending project year, preserving the canonical order for ties. Chapters may overlap in dates; this is not a fabricated employment timeline.
- Images stay in the collage; none is automatically extracted and enlarged into a per-project reading frame. Chapter summaries remain central; small project labels appear beneath the images. Individual case summaries stay in detail/static views.
- Active chapter imagery and text share one strictly monotone spatial rhythm: faster entry/exit at boundaries, a slow reading beat around each overview center. Average travel remains .70 CSS px per physical scroll px; instantaneous movement is about .10 at the reading center and 1.30 at a boundary. There is no scroll snap, timed pause, automatic chapter advance or second smoothing loop.
- All real cards and chapter copy use the same presentation-travel mapping, preserving clearance across boundaries. Chapter centers, navigation anchors, return snapshots, resizing and both progress guides continue to use physical scroll travel. Decorative planes keep their quieter physical-scroll motion through the reading beats, so the scene never feels frozen. Pointer camera motion remains decoupled from the copy.
- Each chapter's entire composition—real images, chapter copy and project labels—shares one scroll-derived zoom: .84 → 1 on entry, 1 during the reading interval (center ±.14 viewport), then 1 → 1.12 as it rises and fades out. Scaling is about the common chapter center, including inter-card positions, not independently about each card. No timed scale tween, restart or jump at chapter boundaries.
- Real projects retain stable authored lanes and a shared base depth, with no sideways exclusion steering. Spacing between adjacent chapter rows protects both imagery and copy throughout translation AND zoom, not just at overview centers. All project rectangles remain 16:9 and projected native-link bounds match their meshes at every scale. Decorative planes retain slower depth-based travel and copy exclusion.
- Pointer motion drives a damped perspective camera; hover provides local emphasis without changing the narrative group. Touch uses native scrolling with no pointer-camera motion.
- Resize preserves the last rendered narrative progress. Reverse scrolling restores the same layout; real projects are not randomly rearranged or recycled into duplicate clickable works.
- Clicking or tapping a real project, or pressing `Enter` on its native link, directly opens the matching detail page with the Flip + Zoom transition below. No intermediate preview panel or second Enter button remains.

### Density contract

At each chapter's overview center, all four UX / four Independent / three Experimental images and their labels fit in the desktop viewport without overlapping the chapter copy or one another. Experimental gives Power Station greater visual weight. Keep approximately 8–16 visible decorative rectangles and faint/edge-cropped neighboring works to imply a larger field.

There are 11 curated scene images, not 18 repeated reading stops. Preserve 18 canonical detail identities, all 16 legacy gallery routes and every archive route. Never duplicate clickable projects to manufacture density. Mobile presents the same 11 selections as native HTML links; all 18 remain in the complete directory and failure fallback.

### Mobile native reading layout (≤700px)

- All three chapters share one content-sized HTML column: left-aligned title, wrapping tags, full chapter summary, then 4/4/3 large 16:9 project images with left-aligned titles beneath. No staggered lanes, four-corner collages or project-summary paragraphs in this compact mobile list. Desktop remains unchanged; the mobile opening follows its separate vertical composition above.
- Keep 20px minimum side margins, 32px from summary to first image, 36px between projects and 64px between chapters. Header anchors have 88px clearance. No viewport-height chapter spacers or trailing empty screens.
- Scrolling is native and 1:1, without Lenis, chapter zoom, depth motion, reading-beat remapping or animated badge exit on mobile. After the opening, the WebGL scene is hidden and its continuous rendering stops; do not destroy it merely for a width breakpoint change.
- Hide the right floating chapter rail on mobile so it cannot cover full-width project images; chapter navigation remains available through the menu. The bottom 2026→2018 axis follows physical reading progress, completes when the final project's bottom is reached, and retires before the résumé. The dog-only Ask AI launcher avoids the axis.
- Browser-toolbar height changes must not programmatically reposition mobile scrolling. Actual desktop/mobile width changes preserve the current chapter-relative position; returning to desktop restores its original compositions.
- Card → detail → return preserves mobile position without replaying the opening. Preserve native modifier clicks, keyboard links, direct chapter hashes (including the Parsons alias), menu navigation, printer and complete directory access.
- Keep the 11 curated projects in normal mobile flow; archive-only works stay in All Projects. Reduced motion or WebGL failure retains all 18 fallback links.
- Validate 390×844, 375×667, 320×568, 700px/701px breakpoint restoration, exact native scroll displacement, card/detail return, keyboard, reduced motion and failure fallback. Real iPhone Safari remains a separate acceptance check.

### Background-plane contract

- Use varied ratios including 1:1, 3:4, 4:5, 2:3, 5:4, and 16:9.
- Decorative planes are texture-free pale rectangles in a separate instanced depth layer, not washed copies of current work.
- Decorative planes are excluded from raycasting, focus, captions, and pointer cursors. Historical project groups have separate opacity state and retain canonical identity.
- Real foreground projects do not overlap one another; restrained overlap is allowed only in decorative/historical depth layers. A projected exclusion zone protects the main image and reading copy.
- No radial white veil, grayscale filter or shader wash may cover the current group.
- WebGL initialization failure, context loss, failed image loading and reduced motion expose the grouped HTML project fallback and never leave scrolling locked.
- Cards and planes have square corners.
- After the final overview's reading interval, the whole scene (including decorative planes and copy) fades out by travel 3.60, before the résumé takes over. The full-width résumé background owns its region; no scene rectangles show through it. Physical chapter anchors, total scroll length and reverse-scroll restoration remain unchanged.

### Scroll guidance

- On desktop, the fixed right-hand capsule indicates whole-page scroll progress and provides keyboard-accessible links to the three chapters in narrative order. At widths ≤700px it is hidden throughout; the menu retains chapter navigation.
- A single bottom axis spans all of Selected Work: fixed endpoints **2026 → 2018**, derived from the featured projects' overall year range. Its fill uses physical travel, reaching 100% at the final overview center, and never resets at chapter boundaries. It fades away as the résumé enters the bottom 9% of the viewport and must not overlay the printer. Year labels describe the collection's date coverage, not a fabricated current year or employment timeline; Independent Work remains first even where chapter dates overlap.
- Both guides use physical scroll position, reverse without replay and stay hidden during the opening. No second scroll smoother or scroll hijacking.
- Reduced-motion/WebGL fallback retains chapter navigation and progress over real HTML sections, with no animated badge scaling or fading.

## 03 — Portfolio menu and complete project index

- No View Static button, spacer section or enclosing horizontal rules remain in the main scrolling story. Preserve the server-authored index as a no-JavaScript alternative; move that same section into the menu when JavaScript runs.
- The upper-right, 44px hamburger fades in with the stationary upper-left name. It is hidden on the resting hero and during the opening; invisible controls are not focusable. Expose correct `aria-controls`, accessible name and `aria-expanded` state.
- The menu contains the three Selected Work chapter links, All Projects, Résumé and Contact. Chapter links preserve canonical anchors and reduced-motion/HTML fallback behavior. Résumé invokes the existing Learn More/printer entry, not a new printer implementation.
- Use a native modal with an explicit Tab/Shift-Tab cycle, visible focus and an accessible close button. Escape and close restore focus and the original main-page scroll, and always release the menu's scroll lock. Only the directory pane scrolls while open; opening it never lengthens the main page. No animation may lock normal page scrolling.
- All Projects opens the complete, quiet 18-project directory, including the seven archive-only projects. No thumbnail entrance flights. Match canonical entries to local `project-scrollcarousel.html?project=N` routes; preserve each case's index and template.
- Retain By Topic and My Journey. My Journey orders Independent & Study → ByteDance → Alibaba → Foundations, with descending dates inside each group. The index is keyboard-accessible and available on mobile/reduced motion; failed gallery fetching retains the server-authored 18 local detail links. Legacy `#work-next` opens the directory.

## 04 — Résumé

### Parent-section order

1. Centered three-line identity copy
2. One explicit `Print my résumé` / `Download résumé` control
3. Existing embedded résumé printer

### Locked behavior

- The parent section is a centered single-column composition on desktop and mobile.
- The centered identity copy is `A multidisciplinary lens into the [product / experiential / content / visual] side of everyday experience.` Only the middle word is deleted and typed again with a caret inside one fixed-width inline slot; the compact three-line layout never reflows. No separate eyebrow appears above it.
- The identity typing waits until at least 20% of the line rests in the viewport for 350ms, pauses when it leaves and restarts on re-entry. It never starts at initial page load while offscreen. Reduced motion keeps the complete first word static.
- Its typography keeps the previously established restrained Selected Work statement scale (17–24px desktop, 15px mobile), not the new large chapter-title or project-description scale.
- The embedded printer has no independent scrollbar; the parent page owns vertical scrolling and fits the iframe to its rendered content.
- Intersection only preloads the embedded printer. The embedded homepage printer never auto-prints on iframe/image load.
- At widths ≤700px, the parent printer control uses text-only labels in print, download and replay states; hide decorative Unicode arrows so iOS cannot substitute emoji. Desktop keeps its existing arrows.
- One parent control owns the complete sequence: `Print my résumé` starts the visible paper feed, then becomes `Download résumé` only after printing finishes. Download tears off the paper and saves the canonical PDF; after completion the same control becomes `Print another copy`. No competing replay or direct-download control appears beside it.
- The embedded printer body is visual-only on the homepage and cannot independently start printing. The printed paper remains interactive for reading and dragging.
- `Learn more about me` only scrolls to this section; the visibility trigger owns the identity animation and the user owns printer playback.
- Preserve reading, replay, paper dragging, save, and PDF-download behavior inside the printer.
- The identity line does not control or synchronize with printer animation.
- The parent print control calls the printer’s public `resumePressPrimary()` API; it must not duplicate or rewrite the printer state machine. Keep `resumePressSave()` for compatibility.
- Fit the same-origin iframe to its rendered application height so controls are not clipped.

Treat the printer’s internal interaction as a separate locked module; visual work around it must not rewrite its state machine.

## 05 — Project detail pages

### Homepage-to-detail transition

Click/tap/keyboard activation opens the matching real detail URL in one step. The approved Flip + Zoom replaces the previous preview → Enter flow and the former no-zoom transition rule.

- A visual-only card surface rotates around its vertical axis while expanding into the detail viewport in one approximately 620ms motion. The front keeps the source image ratio; the reverse face contains the same Hero/header markup and data as the actual destination. Images and type scale uniformly, never stretch into a tall page.
- Navigate once the expanded detail surface is settled. Do not replay a second arrival zoom. Preserve the tab-local return snapshot before navigating.
- Close/footer return/`Escape` restores the original homepage position and reverses the transition into the original card. Preserve the actual detail viewport during handoff, including when closing from further down a case. Returning from Next project still targets the original card.
- The animation overlay is inert visual content in a temporary top-layer dialog; it is not another preview, embedded detail page, SPA router or measurement iframe. The real detail keeps its independent URL, renderer, document scrolling and template assignment.
- Scene cards, the complete directory and HTML fallback use the same navigation path. Text-only links, missing/offscreen source images, reduced motion, unsupported effects or failed/timed-out preparation fall back to ordinary navigation without blocking content.
- Ignore duplicate activation while a transition is active. Escape cancels an in-progress departure. Interruption, resize, reduced-motion changes, storage failure and bfcache restoration must release temporary UI/scroll state. Existing directory scroll locks remain owned by the menu.
- Modifier/middle clicks remain native. Browser Back restores the source without replaying the opening; a native-history return need not replay the decorative flip.

Detail Heroes load the existing full-resolution local source declared by each project's `hero` field, not the 800px homepage thumbnail. Homepage tiles keep the lightweight `thumb`. Preserve each case's original media; do not upscale or regenerate source files.

### Return navigation

- A fixed, keyboard-accessible × and the footer return link close the detail to the originating homepage position; Escape provides the same action.
- Same-tab scene, static-index and fallback detail links save a tab-local return snapshot. Static local detail links no longer force a new tab; explicit modifier-click remains native.
- Return restores scene travel or document scroll and, when entered from the directory, the open menu, directory view, sorting, internal scroll position and project focus, without replaying the opening. Browser Back supports both cached and reloaded homepage paths. Older static-index snapshots open the corresponding menu directory.
- Next project carries the original return token, so closing a later case still returns to the original homepage position.
- Direct detail visits without a valid snapshot return to the homepage Independent Work chapter. Existing independent case URLs and two templates remain intact.

### Locked detail templates

The existing two template types remain distinct:

- **`stacked`** — single-column case study; text and media retain their established vertical sequence.
- **`two-column`** — desktop case study retains its established paired two-column composition instead of being flattened into the stacked template.

Every project declares its template assignment in canonical project data. The renderer must use that assignment; it must not guess from image dimensions or silently convert one template to the other.

Shared detail elements—Hero, project metadata, navigation, and footer—may use common components, while the case-study body preserves its assigned template.

### Responsive contract

- `stacked` remains one reading column on desktop and mobile.
- `two-column` remains two columns where the viewport supports it.
- On narrow screens, `two-column` linearizes into one column using the authored reading order; this responsive fallback does not change the project’s template assignment.

### Detail acceptance checks

- Test at least one `stacked` and one `two-column` project from card click through full detail rendering.
- Verify one activation runs the Flip + Zoom and reaches the real detail URL without a preview step, stretched imagery, second arrival animation or measurement iframe. Verify reverse close, deep-detail close, menu return and reduced-motion/direct-navigation fallback.
- Verify all 18 detail Heroes load their declared full-resolution local sources.
- Verify each project uses its declared template on desktop and preserves reading order on mobile.

## Global — Ask AI

Ask AI remains globally available and contains exactly three providers:

- ChatGPT
- Claude
- Gemini

### Locked behavior

- Fixed bottom-right launcher; at widths ≤700px it is an accessible 48px dog-only button throughout the page, with no visible Ask AI text. Desktop retains the labeled launcher. When the Selected Work bottom axis is visible, the button and its panel move above it; the axis stays 12px above the bottom safe area. Leaving Selected Work restores the button's 10px bottom offset. Preserve the accessible name and click-to-open provider panel; no separate Ask AI section.
- restrained dog idle motion on desktop; no repeating dog idle animation on mobile
- eyes follow pointer
- hover/focus previews the panel
- click pins the panel
- outside click and `Escape` close it
- `Copy Prompt` remains available
- Gemini copies the prompt before handoff when required
- complete keyboard focus path
- reduced-motion support

Perplexity is not part of the current provider set.

## Cross-cutting acceptance

- Preserve all 18 real-project links and project-specific content, including all 16 legacy gallery URLs.
- Interactive UI remains above the WebGL hit area and receives its own clicks.
- Desktop, mobile, keyboard, and reduced-motion paths reach equivalent content.
- No opening, field, or transition animation leaves scrolling locked after completion or interruption.
- JavaScript syntax checks and `git diff --check` pass after implementation.
