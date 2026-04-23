# CLAUDE.md — Screenshot API Specific Rules

**This file supplements `C:\Repositories\endpnt\CLAUDE.md` (platform-wide rules).** Read both. Universal rules (definition of done, mandatory workflow, agent usage, spec archive procedure, status-report honesty) are in the platform file. Only Screenshot-specific guidance lives here.

---

## What this API does

Screenshot renders a URL to an image using headless Chromium. Routes under `/api/v1/`:

- `capture` — render a URL at configurable viewport, format (png/jpeg/webp), full-page or viewport-only, and return base64

Input: URL + render options. Output: base64 image in the standard response envelope.

---

## This is the Heaviest API on the Platform

Screenshot bundles Chromium via `@sparticuz/chromium` and drives it with `playwright-core`. Consequences:

- Function size approaches Vercel's 250MB Pro limit — be careful adding dependencies
- Cold starts are 3-8 seconds (Chromium binary extraction to /tmp)
- Memory is the tightest of any API here — 1GB is plenty for simple pages, 2GB+ needed for heavy SPAs
- `outputFileTracingIncludes` in next.config.js is what tells Vercel to bundle the Chromium binary — DO NOT remove it

If you're adding a new route that DOESN'T need Chromium, keep the browser import lazy. Do not import `chromium` or `playwright-core` at module level in a non-capture route — it'll balloon every function's cold start.

---

## Library Choices

| Library | Purpose | Key gotcha |
|---|---|---|
| `@sparticuz/chromium` | Chromium binary for serverless (Amazon Linux, Vercel) | Version MUST match the Playwright version that bundled its browsers. Mismatch = segfault. |
| `playwright-core` | Browser automation | Use `-core` variant, NOT the full `playwright` package — the full package tries to install browsers at `npm install` time, which fails on Vercel. |

### Chromium + Playwright version pinning

`@sparticuz/chromium` v147.0.0 is paired with a specific Playwright version. **Do NOT upgrade one without the other.** The version compatibility matrix is on the @sparticuz/chromium GitHub. When upgrading either:

1. Check the compat matrix
2. Upgrade both in the same commit
3. Run a full build + actual capture smoke test — a version mismatch often presents as a cryptic "Target closed" or segfault rather than a clean error

### Browser launch flow

Standard pattern in `/api/v1/capture`:

```typescript
import chromium from '@sparticuz/chromium'
import { chromium as pwChromium } from 'playwright-core'

const browser = await pwChromium.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: true,
})
try {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(url, { waitUntil: 'networkidle' })
  const buffer = await page.screenshot({ type: format, fullPage })
  return buffer
} finally {
  await browser.close()  // ALWAYS close or the function leaks until cold-start
}
```

Never forget the `finally` block. A leaked browser process on Vercel doesn't just waste memory — it survives across requests and corrupts subsequent calls.

---

## Next.js Config — CORRECT

Screenshot's `next.config.js` uses correct Next 14 syntax:

```javascript
experimental: {
  serverComponentsExternalPackages: ['@sparticuz/chromium', 'playwright-core']
},
outputFileTracingIncludes: {
  '/api/v1/capture': ['./node_modules/@sparticuz/chromium/bin/**'],
}
```

`outputFileTracingIncludes` is load-bearing — without it, Vercel's function tracer does NOT know the Chromium binary needs to ship with the capture function, and the function fails at runtime with "executable not found."

Do not remove or modify this key without a plan for how Chromium ships to runtime.

---

## Rate-Limit Namespace

Screenshot uses `endpnt:ratelimit:screenshot:{tier}` as the Upstash key prefix for main auth, and `endpnt:demo:screenshot:ratelimit` for demo. These match the platform standard (standardized in Phase 8 of CC-SPEC-DEMO-PROXY-STANDARDIZATION.md). Do NOT change.

---

## Screenshot-Specific Error Codes

Beyond platform errors:

- `INVALID_URL` (400) — malformed URL or non-http(s) scheme
- `BLOCKED_URL` (400) — hostname matches SSRF blocklist (if implemented — verify)
- `NAVIGATION_FAILED` (500) — Chromium couldn't reach or render the URL
- `NAVIGATION_TIMEOUT` (504) — page didn't reach `networkidle` within timeout
- `SCREENSHOT_FAILED` (500) — Chromium crashed mid-capture
- `INVALID_VIEWPORT` (400) — viewport dimensions out of allowed range
- `BROWSER_LAUNCH_FAILED` (500) — Chromium couldn't start (usually means binary extraction failed)

---

## SSRF Protection for URL Input

The `url` parameter in capture requests is the single biggest SSRF surface on the platform — rendering `http://169.254.169.254/...` in Chromium could expose cloud metadata via a screenshot.

Verify whether Screenshot has Preview-style `isSSRFProtected` check on the URL input. If not, flag it for a fix spec. (TODO for Opus during next sweep.)

---

## Timeout and Memory Tuning

Screenshot's `vercel.json` should set `maxDuration` and `memory` for `/api/v1/capture`. Review current values against actual usage — most captures succeed in <10s at 1GB, but heavy JavaScript-rendered pages can need 30-60s at 2GB.

Capture has a distinct cost profile (CPU-bound during render, memory-heavy on big viewports) that argues for per-route config rather than defaults.

---

## Loose files at repo root

`test-screenshot.png` sits at the repo root. Likely a test fixture. Verify it's gitignored or delete if unused.

---

## DO NOT TOUCH (Screenshot-specific)

- `@sparticuz/chromium` or `playwright-core` versions outside a coordinated upgrade spec
- `outputFileTracingIncludes` — removing this breaks Chromium at runtime
- The `browser.close()` in the `finally` block — it's not cosmetic
- `bin/` or any Chromium binary path configuration — Chromium is loaded via node_modules, not bundled separately
