---
name: verify
description: Build, launch, and drive the Dream Jewels landing page to verify changes end-to-end
---

# Verifying the Dream Jewels landing page

Single-page Vite + React app. No test framework — verification is driving the real page in a browser.

## Launch

```powershell
npm run dev          # serves on http://localhost:5173/ (background it)
npm run build        # prod check; expect a single index-*.js ~324 kB (no Three.js chunk — it's unused)
```

## Drive (no Playwright download needed)

Use `playwright-core` with the system Edge — `chromium.launch({ channel: "msedge", headless: true })`.
Install once in the scratchpad: `npm i playwright-core`.

## Flows worth driving

- Title contains "Dream Jewels"; zero `<canvas>` anywhere (Three.js retired — the 4C stone is `/diamond-3d.webp`, check it loads with `naturalWidth > 0`).
- Hero `<video>` (`/hero-jeweler.mp4`) is playing: `!v.paused && v.readyState > 2`, currentTime advancing.
- Nav anchors scroll to `#collections/#heritage/#bespoke/#occasions/#contact` (check `getBoundingClientRect().top` lands in 0–300 range).
- Email form: invalid input → `[role="alert"]` visible; valid → "Thank You" state; empty submit on fresh reload → error.
- Mobile (390×844): menu button opens overlay, `document.body.style.overflow === "hidden"` while open, link tap closes + unlocks + scrolls.
- Images: all `img.complete && naturalWidth > 0` after scrolling to bottom (local assets in `public/`, rest Unsplash).

## Gotchas

- `ImageWithFallback` latches its error state until page reload — a "broken" card may just need a refresh.
- After a successful form submit, the Reserve button is gone; `page.goto(BASE + "#contact")` does NOT reload the page — use `page.reload()`.
- Collect `console` error and `pageerror` events; the page should produce none.
