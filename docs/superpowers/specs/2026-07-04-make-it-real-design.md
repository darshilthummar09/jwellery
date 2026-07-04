# Make the Jewelry Landing Page Look Real — Design

**Date:** 2026-07-04
**Request:** "Understand the code and make it look real."
**Interpretation:** The site is a Figma Make export that reads as an AI/template demo. Make it feel like the production website of a real jewellery brand: every control works, content is coherent, imagery matches the products, and the page holds up on mobile.

> Note: this session ran autonomously, so approach selection was made per the
> recommendation below rather than via interactive Q&A. Review and object freely —
> everything is reversible.

## Current state

- Vite + React 18 + Tailwind v4 + Motion + Three.js. All page code lives in `src/app/App.tsx` (~1,160 lines): Navbar, Hero (Three.js diamond), StatsBar, Collections, DiamondShowcase, HeritageBanner, Testimonials, Bespoke, Contact, Footer.
- shadcn/ui components exist under `src/app/components/ui/` but are unused by the page.
- `ImageWithFallback` exists (`src/app/components/figma/ImageWithFallback.tsx`) but is unused.

## Problems found

| # | Problem | Why it breaks realism |
|---|---------|----------------------|
| 1 | All CTAs are dead buttons | First click reveals it's a mockup |
| 2 | Nav links to `#occasions`; no such section | Broken navigation |
| 3 | Mobile menu has no `AnimatePresence` — snaps closed; no exit animation; body still scrolls behind it | Feels unfinished on phones |
| 4 | No smooth scrolling; anchored sections hide under the fixed navbar | Jarring jumps |
| 5 | Same photo used for "Midnight Pavé" bracelet and Heritage banner; "Earrings" photo is not earrings | Obvious stock-photo carelessness |
| 6 | `font-700`/`font-600`/`font-400` are not Tailwind v4 utilities — silently no-ops | Headings render at default weight |
| 7 | Email capture: uncontrolled input, no validation, no feedback | Dead form |
| 8 | `<title>` "3D Animated Jewelry Landing Page", robots `noindex` | Template metadata |
| 9 | Plain `<img>` everywhere — broken URL shows browser broken-image icon | Fragile |
| 10 | 3D canvas fixed at 320×320 regardless of viewport | Oversized on small phones |
| 11 | Monolithic 1,160-line App.tsx | Hard to maintain |

## Approaches considered

- **A. Cosmetic pass in place** — fix images/copy/meta only. Cheap, but buttons stay dead; still a mockup.
- **B. Realism pass + section split (recommended)** — fix every problem above, add the missing Occasions section, wire all CTAs to real targets, validate the email form with inline feedback, and split App.tsx into one file per section under `src/app/components/sections/`. Keeps the existing visual language (dark + gold, Cinzel/Playfair/Raleway) which is already good.
- **C. Full product build** — routing, product pages, cart, CMS data layer. Rejected: YAGNI for a landing page; nothing in the request asks for commerce.

## Design (approach B)

**Architecture.** `App.tsx` becomes a thin composer. Each section moves to `src/app/components/sections/<Name>.tsx`. Shared bits (`DiamondSVG`, `GoldText` gradient span, data constants) go to `src/app/components/sections/shared.tsx` and `src/app/data/site.ts`. No behavior change from the split itself.

**Interactions.**
- All CTAs scroll to real anchors: Explore Collections → `#collections`, Our Legacy/Our Story → `#heritage`, Book Appointment / Begin Your Journey / View All Collections → `#contact`.
- `scroll-behavior: smooth` on `html`; `scroll-margin-top` on sections so the fixed navbar never covers headings.
- Mobile menu wrapped in `AnimatePresence` with staggered link entrance; body scroll locked while open.
- Email capture becomes a controlled form: validates format, shows inline success ("Thank you — our concierge will contact you within 24 hours") or error state; no backend (out of scope), state is client-side only.

**Content.**
- New **Occasions** section (`#occasions`): four cards — Engagements, Weddings, Anniversaries, Festive — matching the existing card language.
- Distinct, subject-appropriate Unsplash photos per product/section, all rendered through `ImageWithFallback`.
- Footer gains quick links, opening hours, and certification line. Metadata becomes brand-real: title "A Dream Jewels — Fine Diamond Jewellery | Mumbai", honest description, `noindex` removed, theme-color set.

**Polish.**
- Replace invalid `font-700/600/400` with real utilities (`font-bold`, `font-semibold`, `font-normal`).
- 3D diamond canvas sizes to its container (280px on small screens, 320px otherwise) and gets subtle pointer parallax.
- `focus-visible` rings on interactive elements; `aria-label`s on icon-only buttons/links.

**Error handling.** Images degrade via `ImageWithFallback`; WebGL failure is caught so the hero still renders text if Three.js can't start.

**Testing/verification.** No test infra exists and adding one isn't warranted for a static landing page; verification is `npm run build` clean + running the dev server and exercising nav, menu, tabs, carousel, and form.

## Out of scope

Backend/form submission service, e-commerce, CMS, routing, additional pages, SEO beyond metadata.
