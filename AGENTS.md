# Project Engineering Guidelines

> **Read this before any implementation work in this repo.** These are the
> standing rules for every change — features, refactors, bug fixes, and
> performance work alike. When a tradeoff isn't covered here, prefer the
> option that aligns with the spirit of these guidelines.

This is a Vite + React 18 + TypeScript + Tailwind CSS app. The user base
includes low-end Android devices common in Southeast Asian markets, so
performance on constrained hardware is a first-class concern, not a
late-stage polish.

---

## Performance Optimization Guidelines for Cross-Device Compatibility

A comprehensive checklist for building fast, responsive web experiences that perform well across the device spectrum — from flagship phones to low-end Android devices common in emerging markets.

---

### I. Planning

1. **Define target devices**
   - List specific devices or categories (e.g., low-end Android with 2GB RAM, mid-range iPhone, desktop with throttled 3G).
   - Identify the **lowest common denominator** — design for it first, enhance upward.
   - Map your real user base using analytics (device, OS, network, screen size). Don't optimize for devices your users don't have.
   - Consider regional context: 4G coverage, data costs, and device age vary widely.

2. **Set performance budgets**
   - **Time to Interactive (TTI):** under 3.5s on a mid-range mobile device on 4G.
   - **Largest Contentful Paint (LCP):** under 2.5s.
   - **First Input Delay (FID) / Interaction to Next Paint (INP):** under 100ms / 200ms.
   - **Cumulative Layout Shift (CLS):** under 0.1.
   - **Total page weight:** under 1MB for content-heavy pages, under 300KB for landing pages.
   - **JavaScript bundle:** under 170KB compressed for the initial route.
   - **Animation FPS:** consistent 60fps; never below 30fps on target hardware.
   - Enforce budgets in CI with tools like Lighthouse CI, bundlesize, or size-limit.

3. **Establish a measurement baseline**
   - Capture current metrics before optimizing — you can't improve what you don't measure.
   - Use Real User Monitoring (RUM) alongside synthetic tests.
   - Track Core Web Vitals over time, segmented by device class and geography.

4. **Prioritize the critical rendering path**
   - Identify the minimum HTML, CSS, and JS needed for above-the-fold content.
   - Defer everything else.

---

### II. HTML

1. **Minimize DOM depth and node count**
   - Aim for fewer than 1,500 nodes total and a tree depth under 32 levels.
   - Flat structures render faster than deeply nested ones.
   - Avoid wrapper-div proliferation; question every container.

2. **Use semantic HTML**
   - Use `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`, `<button>`, `<label>`.
   - Browsers optimize rendering for known elements; screen readers and SEO benefit too.
   - Replace `<div onclick>` with real `<button>` elements — better accessibility, fewer JS handlers.

3. **Avoid inline styles**
   - External stylesheets cache across pages; inline styles re-download with every HTML response.
   - Exception: critical CSS inlined in `<head>` for above-the-fold content (under ~14KB).

4. **Optimize resource loading order**
   - Place critical CSS in `<head>`; defer non-critical CSS with `media="print" onload="this.media='all'"` or `<link rel="preload">`.
   - Place `<script>` tags at the end of `<body>` or use `defer` / `async` attributes.
   - Use `<link rel="preconnect">` for third-party origins you'll fetch from.
   - Use `<link rel="dns-prefetch">` for less critical third-party origins.
   - Use `<link rel="preload">` sparingly for hero images, key fonts, and critical scripts.

5. **Set explicit dimensions on media**
   - Always include `width` and `height` on `<img>` and `<video>` to reserve space and prevent CLS.
   - Use `aspect-ratio` in CSS for responsive media containers.

6. **Reduce HTML payload**
   - Minify HTML in production (remove comments, whitespace, optional tags).
   - Avoid sending hidden DOM trees (e.g., all modal content) when they can be lazy-injected.

---

### III. CSS

1. **Use CSS custom properties (variables)**
   - Centralize colors, spacing, typography, breakpoints.
   - Enables runtime theming without re-downloading stylesheets.
   - Reduces duplication and stylesheet size.

2. **Minimize selector complexity**
   - Adopt **BEM**, **SUIT CSS**, or utility-first (e.g., Tailwind) to keep selectors flat.
   - Avoid descendant selectors deeper than 3 levels (`.a .b .c .d` is slow).
   - Avoid universal selectors (`*`) in performance-critical paths.
   - Prefer class selectors over tag or attribute selectors when possible.

3. **Avoid expensive properties on animated elements**
   - Animating `box-shadow`, `filter`, `border-radius`, `width`, `height`, `top`, `left` triggers layout or paint.
   - Prefer `transform` and `opacity` — they run on the compositor thread.
   - Replace heavy `box-shadow` with a layered pseudo-element shadow if needed.

4. **Use hardware acceleration deliberately**
   - `transform: translateZ(0)` or `will-change: transform` promotes elements to their own layer.
   - **Don't overuse:** every layer costs GPU memory; on low-end devices, too many layers cause jank.
   - Apply `will-change` only just before an animation, then remove it.

5. **Optimize animations**
   - Use `transform` and `opacity` only.
   - Use `steps()` for sprite-style animations.
   - Use `animation-fill-mode: forwards` to retain the final state without JS.
   - Respect `prefers-reduced-motion` — skip or shorten animations for users who request it.
   - Keep animation duration under 300ms for UI feedback; longer for narrative motion.

6. **Reduce CSS payload**
   - Remove unused CSS with PurgeCSS, UnCSS, or framework-built tooling.
   - Split CSS by route or component; load only what each page needs.
   - Use `@media` queries to gate rarely-used styles (`<link rel="stylesheet" media="print">`).
   - Minify and Brotli-compress in production.

7. **Use modern layout primitives**
   - Flexbox and Grid are highly optimized in modern browsers.
   - Avoid float-based layouts and absolute-position hacks.
   - `content-visibility: auto` skips rendering work for off-screen sections.

8. **Optimize fonts**
   - Use `font-display: swap` to prevent invisible text during load.
   - Subset fonts to only the characters and weights you use.
   - Self-host fonts to avoid third-party DNS and connection overhead.
   - Use variable fonts for multi-weight sites — one file replaces many.
   - Preload critical fonts: `<link rel="preload" as="font" type="font/woff2" crossorigin>`.

---

### IV. JavaScript

1. **Minimize library dependencies**
   - Audit bundle with `webpack-bundle-analyzer`, `source-map-explorer`, or `bundlephobia`.
   - Replace large libraries with native APIs: `fetch` instead of axios, `Date` instead of moment, native ES methods instead of lodash for simple cases.
   - For small needs, prefer lightweight alternatives (date-fns over moment, preact over React for tiny apps).
   - Tree-shake aggressively — import named exports only.

2. **Optimize DOM interactions**
   - Cache DOM references; don't re-query in loops.
   - Batch reads and writes to avoid layout thrashing (read all, then write all).
   - Use `DocumentFragment` to build large subtrees off-DOM, then insert once.
   - Prefer `textContent` over `innerHTML` when not parsing markup (faster, safer).
   - Use event delegation — one listener on a parent beats hundreds on children.

3. **Debounce and throttle**
   - **Debounce** input/search/resize handlers (fire after activity stops).
   - **Throttle** scroll and mousemove handlers (fire at most every N ms).
   - Use `requestAnimationFrame` for scroll handlers when updating visuals.
   - Use `IntersectionObserver` instead of scroll listeners for visibility detection.
   - Use `ResizeObserver` instead of window resize for element size changes.

4. **Use requestAnimationFrame for animations**
   - Synchronize JS-driven animations to the browser's repaint cycle.
   - Cancel pending frames when the animation ends or the element unmounts.
   - For physics or game loops, calculate delta time — don't assume 60fps.

5. **Profile and optimize**
   - Use Chrome DevTools **Performance** panel: record, look for long tasks (>50ms), layout shifts, and dropped frames.
   - Use the **Coverage** tab to find unused JS and CSS.
   - Use the **Memory** tab to detect leaks (detached DOM nodes, growing heap).
   - Test on real low-end hardware, not just throttled desktops — CPU profiles differ.

6. **Code splitting and lazy loading**
   - Split bundles by route; load route code only when navigated to.
   - Dynamic `import()` for heavy components used conditionally (modals, editors, charts).
   - Lazy-load below-the-fold widgets with `IntersectionObserver`.

7. **Web Workers for heavy work**
   - Move parsing, image processing, encryption, and large data transforms off the main thread.
   - Keep the main thread responsive for user input and rendering.

8. **Avoid main-thread blocking**
   - Break long tasks into chunks with `setTimeout`, `requestIdleCallback`, or `scheduler.yield()`.
   - Never block on synchronous network or file I/O.

9. **Memory hygiene**
   - Remove event listeners on cleanup.
   - Clear intervals and timeouts.
   - Nullify large object references when done.
   - Watch for closures retaining DOM nodes.

---

### V. Images and Media

1. **Choose the right format**
   - **AVIF** for best compression (modern browsers).
   - **WebP** as a strong baseline with wide support.
   - **JPEG** (MozJPEG-encoded) as fallback for photos.
   - **PNG** only for transparency or pixel art.
   - **SVG** for icons, logos, illustrations — scales infinitely, often smaller than raster.
   - Use `<picture>` with multiple `<source>` elements to serve modern formats with fallbacks.

2. **Serve responsive images**
   - Use `srcset` and `sizes` to deliver appropriately sized images per viewport.
   - Generate multiple resolutions during build (1x, 2x, 3x).
   - Consider art direction with `<picture>` for different crops on different screens.

3. **Lazy load below-the-fold media**
   - Native: `<img loading="lazy">` and `<iframe loading="lazy">`.
   - Eager-load above-the-fold images (LCP candidates) — never lazy-load the hero.
   - Use `decoding="async"` on non-critical images.

4. **Compress aggressively**
   - Run images through Squoosh, ImageOptim, MozJPEG, or build-time pipelines (sharp, imagemin).
   - Target visually lossless — most users can't distinguish 80% quality JPEG from 100%.
   - Strip EXIF metadata.

5. **Optimize video**
   - Use H.264 (broad support) or VP9/AV1 (better compression, modern browsers).
   - Provide multiple resolutions (HLS or DASH for adaptive streaming).
   - Use `preload="none"` or `preload="metadata"` unless autoplaying.
   - Replace decorative looping videos with optimized GIF alternatives — or better, CSS animations.
   - Consider lightweight video alternatives like animated WebP or APNG for short clips.

6. **Use a CDN with image optimization**
   - Services like Cloudinary, imgix, Cloudflare Images, or Vercel Image deliver per-device-optimized images on demand.
   - Saves build complexity and pipeline maintenance.

7. **Icons and graphics**
   - Use icon fonts sparingly — they block render and load all glyphs.
   - Prefer inline SVG for icons (cacheable in component, themeable with `currentColor`).
   - SVG sprites consolidate many icons into one request.

---

### VI. Testing

1. **Test on real target devices**
   - Maintain a device lab or use cloud services (BrowserStack, LambdaTest, Sauce Labs).
   - For Southeast Asian markets specifically: test on devices like Xiaomi Redmi entry tier, Samsung A-series, older iPhone SE.
   - Test in real network conditions, not just simulated ones.

2. **Use Chrome DevTools throttling**
   - Simulate "Slow 4G" and "Fast 3G" network presets.
   - Use 4x or 6x CPU slowdown to mimic low-end hardware.
   - Combine network and CPU throttling for realistic emerging-market conditions.

3. **Profile animations**
   - Use the Performance panel's FPS meter.
   - Look for long frames (red bars) and layout shifts.
   - Check the rendering tab's "Paint flashing" and "Layer borders" overlays.

4. **Run Lighthouse audits**
   - Run in CI with mobile profile enabled.
   - Track Performance, Accessibility, Best Practices, and SEO scores.
   - Set minimum thresholds and fail builds that regress.

5. **Use WebPageTest for deep analysis**
   - Test from real locations matching your user base.
   - Get filmstrip views, waterfall charts, and connection-level diagnostics.

6. **Cross-browser testing**
   - Verify on Chrome, Safari (iOS especially), Firefox, Samsung Internet, UC Browser (Asia).
   - Different rendering engines have different performance profiles.

7. **Accessibility and motion testing**
   - Test with `prefers-reduced-motion` enabled.
   - Test with screen readers (VoiceOver, TalkBack, NVDA).
   - Verify keyboard navigation doesn't trigger expensive layouts.

---

### VII. Deployment

1. **Enable compression**
   - **Brotli** for static assets (better than gzip by 15–25%).
   - **Gzip** as fallback for clients that don't support Brotli.
   - Compress text formats: HTML, CSS, JS, JSON, SVG, fonts.

2. **Set effective caching headers**
   - Versioned/hashed assets: `Cache-Control: public, max-age=31536000, immutable`.
   - HTML: `Cache-Control: no-cache` or short max-age — must revalidate.
   - Use ETags or Last-Modified for conditional requests.
   - Configure `stale-while-revalidate` for instant repeat visits with background refresh.

3. **Use a CDN**
   - Serve static assets from edge locations close to users.
   - Particularly important for global audiences and emerging markets where latency to origin servers can be 200ms+.

4. **HTTP/2 or HTTP/3**
   - Multiplexing eliminates the need for old workarounds (sprite sheets, domain sharding, file concatenation).
   - HTTP/3 (QUIC) performs better on lossy mobile networks.

5. **Service Workers for offline and instant repeat visits**
   - Cache the app shell for instant subsequent loads.
   - Use stale-while-revalidate for API responses where freshness isn't critical.
   - Be cautious — buggy service workers can brick a site.

6. **Monitor performance in production**
   - **RUM tools:** SpeedCurve, Calibre, New Relic, Datadog RUM, Sentry Performance.
   - Track Core Web Vitals via the `web-vitals` library, send to your analytics endpoint.
   - Segment by device class, country, and connection type — averages hide problems.
   - Set up alerting for regressions on key flows.

7. **Reduce third-party impact**
   - Audit every third-party script — analytics, tag managers, chat widgets, ads.
   - Self-host critical third-party scripts when possible.
   - Load non-critical third parties with `async` and after the main content.
   - Use Partytown or similar to move third-party scripts to a Web Worker.

8. **Progressive enhancement strategy**
   - Ensure core content and functionality work without JS.
   - Layer enhancements for capable devices; degrade gracefully for older ones.
   - Particularly valuable for users on flaky networks where JS may fail to load.

---

### VIII. Ongoing Practice

1. **Performance reviews in PRs**
   - Bundle size diffs in PR comments.
   - Lighthouse score deltas.
   - Visual regression tests for layout shifts.

2. **Performance culture**
   - Make performance everyone's responsibility, not just a single engineer's.
   - Share metrics in standups, retrospectives, and quarterly reviews.
   - Celebrate wins and treat regressions as bugs.

3. **Stay current**
   - Follow web.dev, Smashing Magazine, and the Chrome team's blog.
   - New APIs (e.g., `content-visibility`, `Speculation Rules`, `View Transitions`) regularly unlock easy wins.

---

*Performance is a feature — and on low-end devices in emerging markets, it's often the most important one. Every 100ms of improvement compounds across millions of sessions.*
