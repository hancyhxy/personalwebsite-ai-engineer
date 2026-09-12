# AI provider marks — checked 2026-09-07

Provider buttons use actual artwork, not Unicode lookalikes. These links identify destination services, not sponsorship. Preserve trademark rights and review brand usage terms before publishing.

- **ChatGPT** `chatgpt.svg`: official OpenAI black monoblossom, unchanged SVG from https://cdn.openai.com/brand/OpenAI-Logos-2025.zip (`OpenAI-logos(new)/SVGs/OpenAI-black-monoblossom.svg`). Guidelines: https://openai.com/brand/ . Its included whitespace is compensated by uniform CSS scaling.
- **Claude** `claude.svg`: exact asterisk vector path extracted from the current https://claude.com homepage's `svg[aria-label=Claude]`, second path, bounding box 0 0 125 125. Displayed in Claude rust #D97757; no glyph approximation. Replaces the initial SVGL download.
- **Gemini** `gemini.svg`: current official site icon from https://gemini.google.com → https://www.gstatic.com/lamda/images/gemini_sparkle_aurora_33f86dc0c0257da337c63.svg . Unchanged vector. This replaces Google AI Mode, not just its icon. Destination: https://gemini.google.com/app . No unverified prompt-prefill parameter: attempt clipboard copy on activation, then the visitor pastes in Gemini. Copy/manual fallback remains.
- **Perplexity** `perplexity.svg`: checked against the live Perplexity (2026) brand book https://live.standards.site/perplexity/logo . Downloaded its `Perplexity Logo Nov 2025.zip`, `Symbol/Perplexity-Symbol-Single-Light.svg`; extracted original symbol path, preserved #133440, removed the presentation-board rectangle and cropped viewBox to 824.3 382 271.5 315.9. The earlier SVGL download is replaced.
  Archive linked by the brand book: https://firebasestorage.googleapis.com/v0/b/standards-site-beta.appspot.com/o/documents%2F6t12iheczyb%2F732776432bb%2FPerplexity%20Logo%20Nov%202025.zip?alt=media&token=408ae771-e0cc-40f7-bb5c-00e6a82ab7fb

`google-g.png` was downloaded from Google's official brand hub during verification but is NOT used: the user clarified that this destination must be Gemini. Do not substitute a Google G or a generic sparkle.

Official sites blocked plain HTTP fetches for Claude and Perplexity; browser rendering succeeded and was used to inspect their current vector assets / published downloads.

## Dog motion

Closed-state CSS animations: 8s breath/head-tilt cycle, 11s occasional gaze, 9s ear flick, existing 6.4s blink. Mouse eye-follow remains independent. Open state suspends idle head/gaze in favor of interaction pose; closing restores idle (including touch). Hidden-tab class pauses animations. Reduced-motion disables all new cycles. No timer-driven infinite JavaScript animation loop.

Browser checks passed for four loaded logos, Gemini URL, copy fallback, idle before opening / after touch close, reduced-motion, and no JS errors. Browser teardown hit the harness timeout after assertions completed; this was not a page assertion failure.
