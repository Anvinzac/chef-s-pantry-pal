# Copilot Instructions

This is a Vite + React 18 + TypeScript + Tailwind app. The user base
includes low-end Android devices common in Southeast Asian markets, so
performance on constrained hardware is a first-class concern, not
late-stage polish.

**The canonical engineering guidelines live in [`AGENTS.md`](../AGENTS.md).
Read that file before non-trivial changes.** Below are the always-on
rules to apply to every suggestion.

## Always apply

- **Animate only `transform` and `opacity`.** Avoid `filter`,
  `box-shadow`, `border-radius`, `width`, `height`, `top`, `left` on
  animated elements.
- **Throttle scroll and pointermove handlers with
  `requestAnimationFrame`.** Coalesce per-event work to one tick per
  frame. Cancel pending frames on unmount.
- **Debounce input/search/resize handlers.** `setTimeout` for delays;
  `requestAnimationFrame` for visual updates.
- **`backdrop-filter` is expensive on large surfaces.** Don't use it on
  sticky headers or full-page overlays. Higher-opacity background is
  cheaper and visually near-identical.
- **Lazy-load all routes via `React.lazy()` + `Suspense`.** Bundle
  budget per route: under 170 kB gzipped.
- **Use semantic HTML.** `<button>`, `<header>`, `<main>`, `<nav>`,
  `<label>` — never `<div onclick>`.
- **Set explicit `width`/`height` on media** to prevent CLS.
- **Use `IntersectionObserver`** for visibility, `ResizeObserver` for
  element size — not scroll/resize listeners.
- **Clean up on unmount:** remove listeners, clear timeouts, cancel
  rAFs.
- **Test at mobile (375), tablet (768), desktop (1280).** A
  `useBreakpoint` hook lives at `src/hooks/useBreakpoint.ts`.

## Performance budgets

- TTI mid-range mobile + 4G: **under 3.5s**
- LCP: **under 2.5s** | INP: **under 200ms** | CLS: **under 0.1**
- JS per route: **under 170 kB gzipped**
- Animation FPS: **60 sustained, never below 30** on target hardware

When a tradeoff isn't covered here, consult [`AGENTS.md`](../AGENTS.md)
for the full Planning / HTML / CSS / JS / Images / Testing / Deployment
checklist.
