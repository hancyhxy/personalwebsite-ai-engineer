# Badge scene runtime dependencies

No package manager or build step is introduced. These scripts are loaded locally by `index-badge.html`.

- Three.js r125: existing `three-r125.min.js`; MIT. Kept at the existing version to avoid changing other themes. The scene uses the r125 `sRGBEncoding` API.
- GSAP 3.10.4: existing `gsap-3.10.4.min.js`; retain its original license header.
- ScrollTrigger 3.10.4: `ScrollTrigger-3.10.4.min.js`, downloaded from https://cdn.jsdelivr.net/npm/gsap@3.10.4/dist/ScrollTrigger.min.js on 2026-09-09. Matching GSAP version. Original copyright and GreenSock license notice are retained at the top of the file; terms linked there apply.
- Lenis 1.1.9: existing `lenis-1.1.9.min.js`; MIT license saved as `LENIS-LICENSE.txt` from https://cdn.jsdelivr.net/npm/lenis@1.1.9/LICENSE.

Getty's deployed application bundles and artwork were inspected for architecture research only. They are not runtime dependencies and are not copied into this directory.
