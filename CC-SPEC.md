# endpnt Screenshot API — CC Spec (Part 1 of 5)
**Version:** 1.0
**Date:** April 13, 2026
**Author:** Opus (planning only — CC executes all code changes)
**Agent:** Start with architect → then frontend-agent + backend-agent for implementation
**Project:** endpnt.dev — Developer API platform
**Repo:** endpnt-dev/screenshot

---

## CRITICAL: Environment Setup (READ FIRST)

Before doing ANYTHING, run these commands to ensure you're in the right place:

```bash
cd /c/Repositories/endpnt/screenshot
pwd
# Must show: /c/Repositories/endpnt/screenshot

git branch
# Must show: * dev
# If not on dev, run: git checkout dev

git status
# Should be clean. If not, stash or commit existing changes.
```

**Git workflow for this project:**
- Work on `dev` branch
- Push to `dev` when done — Vercel auto-deploys a preview URL
- DO push to dev — this is different from BTS Staffing App workflow
- JK will review the preview, then open a PR to main on GitHub for production deploy

---

## Overview

Build the Screenshot API — the first of 5 utility APIs for the endpnt.dev platform. This API accepts a URL from a customer, launches a headless Chromium browser, navigates to the page, captures a screenshot, and returns the image. It includes a landing page, interactive docs page, and pricing page alongside the API endpoint.

This is a greenfield build — there is no existing code beyond a package.json placeholder. Build everything from scratch using Next.js 14+ App Router, Playwright for browser automation, and Upstash Redis for rate limiting.

The API will be deployed to Vercel and accessible at screenshot.endpnt.dev.

---

## Requirements

1. API accepts a URL and returns a screenshot as PNG, JPEG, WebP, or PDF
2. Supports custom viewport sizes (width/height), full-page capture, element targeting via CSS selector, dark mode emulation, and device presets (desktop/mobile/tablet)
3. API key authentication via `x-api-key` header — keys prefixed with `ek_`
4. Rate limiting via Upstash Redis using sliding window algorithm
5. Consistent JSON response envelope: `{ success, data, meta }` for all responses
6. Proper error handling with typed error codes (INVALID_URL, RATE_LIMIT_EXCEEDED, AUTH_REQUIRED, etc.)
7. Landing page at `/` — explains what the API does, shows code examples, has CTA
8. Interactive docs page at `/docs` — developer can paste a URL, test the API live, see the screenshot
9. Pricing page at `/pricing` — shows Free/Starter/Pro/Enterprise tiers
10. Health check endpoint at `/api/v1/health`
11. GET and POST methods supported on the capture endpoint
12. Must work on Vercel Serverless Functions (Chromium binary handling required)

---

## Suggestions & Context

### Tech Stack
- **Framework:** Next.js 14+ with App Router (app/ directory, not pages/)
- **Language:** TypeScript throughout
- **Browser:** Use `@sparticuz/chromium-min` + `playwright-core` for Vercel compatibility. Standard Playwright bundles Chromium at ~280MB which exceeds Vercel's function size limit. The `@sparticuz/chromium-min` package provides a stripped-down Chromium binary (~50MB) that works in serverless environments.
- **Rate Limiting:** `@upstash/ratelimit` + `@upstash/redis` — env vars `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are already configured in Vercel
- **Styling:** Tailwind CSS — dark theme, developer-focused aesthetic similar to Vercel.com or Linear.app

### Folder Structure

```
screenshot/
  app/
    api/
      v1/
        capture/
          route.ts            ← Core screenshot logic
        health/
          route.ts            ← Health check
    page.tsx                  ← Landing page
    docs/
      page.tsx                ← Interactive API docs
    pricing/
      page.tsx                ← Pricing tiers
    layout.tsx                ← Root layout (dark theme, fonts)
    globals.css               ← Tailwind + global styles
  lib/
    auth.ts                   ← API key validation
    rate-limit.ts             ← Upstash rate limiter setup
    response.ts               ← Standard response builder ({ success, data, meta })
    screenshot.ts             ← Playwright browser launch + capture logic
    config.ts                 ← Constants (tiers, limits, defaults)
  middleware.ts               ← CORS handling
  package.json
  tsconfig.json
  next.config.js
  tailwind.config.ts
  postcss.config.js
  .env.example                ← Template showing required env vars
  vercel.json                 ← Function config for Chromium binary size
  README.md
```

### API Endpoint: POST /api/v1/capture

**Request parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| url | string | Yes | — | URL to screenshot. Must be valid http/https |
| format | string | No | "png" | Output: "png", "jpeg", "webp", "pdf" |
| width | number | No | 1280 | Viewport width in px. Range: 320-3840 |
| height | number | No | 720 | Viewport height in px. Range: 320-2160 |
| full_page | boolean | No | false | Capture entire scrollable page |
| wait_for | number | No | 0 | Ms to wait after load. Max: 10000 |
| selector | string | No | — | CSS selector to capture specific element |
| quality | number | No | 80 | JPEG/WebP quality 1-100 |
| dark_mode | boolean | No | false | Emulate dark color scheme |
| device | string | No | "desktop" | "desktop", "mobile", "tablet" — sets viewport + user agent |

**Success response:**
```json
{
  "success": true,
  "data": {
    "image": "base64_encoded_image_data...",
    "width": 1440,
    "height": 900,
    "format": "png",
    "file_size_bytes": 284720
  },
  "meta": {
    "request_id": "req_a1b2c3d4",
    "processing_ms": 1840,
    "remaining_credits": 99
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "The provided URL is not valid. Must be http:// or https://"
  }
}
```

**Error codes to implement:**
- `AUTH_REQUIRED` (401) — missing x-api-key header
- `INVALID_API_KEY` (401) — key doesn't exist
- `RATE_LIMIT_EXCEEDED` (429) — too many requests
- `INVALID_URL` (400) — URL is malformed or not http/https
- `INVALID_PARAMS` (400) — parameter validation failed
- `CAPTURE_FAILED` (500) — browser couldn't capture the page
- `TIMEOUT` (504) — page took too long to load

### API Key Auth (V1 — Simple)
For launch, store API keys as a JSON environment variable. No database needed yet.

```
API_KEYS={"ek_live_demo123":{"tier":"free","name":"Demo Key"},"ek_live_test456":{"tier":"starter","name":"Test User"}}
```

The auth middleware reads `x-api-key` header, looks up in this JSON, and attaches the key info to the request context. This is intentionally simple — when you hit ~50 customers, migrate to Supabase.

Include a demo key `ek_live_demo123` with free tier access so the interactive docs page can make real API calls.

### Rate Limit Tiers
```typescript
const TIER_LIMITS = {
  free: { requests_per_minute: 10, requests_per_month: 100 },
  starter: { requests_per_minute: 60, requests_per_month: 5000 },
  pro: { requests_per_minute: 300, requests_per_month: 25000 },
  enterprise: { requests_per_minute: 1000, requests_per_month: 100000 },
};
```

### Vercel Configuration
The Chromium binary requires a larger function size. `vercel.json` needs:

```json
{
  "functions": {
    "app/api/v1/capture/route.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

### Device Presets
```typescript
const DEVICE_PRESETS = {
  desktop: { width: 1280, height: 720, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..." },
  mobile: { width: 390, height: 844, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0...)..." },
  tablet: { width: 820, height: 1180, userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0...)..." },
};
```

### Landing Page Content
The landing page at `/` should include:
- Hero: "Screenshot any webpage with one API call" + code example
- Feature grid: Full-page capture, device emulation, dark mode, element targeting, multiple formats, blazing fast
- Interactive demo: Paste a URL input, click "Capture", show the resulting screenshot (uses the demo key)
- Code examples in curl, JavaScript, Python
- CTA: "Get your free API key" linking to /pricing
- Footer: Links to docs, pricing, GitHub (endpnt-dev/screenshot), endpnt.dev hub

### Docs Page Content
The docs page at `/docs` should include:
- Authentication section (how to get and use API keys)
- Interactive API tester — form with all parameters, "Send Request" button, shows the response JSON and rendered screenshot
- Parameter reference table
- Code examples in multiple languages
- Error code reference table
- Rate limit explanation

### Pricing Page Content
The pricing page at `/pricing` should include:
- 4-tier comparison table: Free, Starter ($29/mo), Pro ($99/mo), Enterprise (Contact us)
- Feature comparison across tiers
- FAQ section (What counts as a request? What formats are supported? etc.)

### Design Direction
- Dark theme (dark background, light text)
- Monospace font for code, logo, and technical text
- Sans-serif for body text
- Color accent: teal/green (#0F6E56 or similar)
- Clean, minimal layout — lots of whitespace
- Syntax-highlighted code blocks
- Similar aesthetic to Vercel.com, Resend.com, or Linear.app

---

## DO NOT TOUCH

- Do not modify any files outside the `/c/Repositories/endpnt/screenshot/` directory
- Do not touch any other endpnt repos (web, preview, qr, convert, validate)
- Do not delete the existing README.md — update it with API documentation instead

---

## Edge Cases

1. URL with no protocol — should auto-prepend https:// or return INVALID_URL error
2. URL that returns a 404 — should still screenshot the 404 page, not error
3. URL that takes >30 seconds to load — should timeout gracefully with TIMEOUT error
4. URL with login wall / auth required — screenshot whatever is visible (the login page)
5. Empty or whitespace-only URL — return INVALID_PARAMS
6. Width/height outside valid range — clamp to range or return INVALID_PARAMS
7. Invalid format value — return INVALID_PARAMS with list of valid formats
8. Selector that doesn't exist on the page — return CAPTURE_FAILED with helpful message
9. Very large full_page screenshot (long page) — may need to cap max height
10. Concurrent requests from same key — rate limiter must handle correctly
11. Missing UPSTASH env vars — API should return 500 with clear error, not crash

---

## Environment Variables

Create a `.env.example` file with these variables (values are placeholders):

```
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
API_KEYS={"ek_live_demo123":{"tier":"free","name":"Demo Key"}}
NEXT_PUBLIC_SITE_URL=https://screenshot.endpnt.dev
```

For local development, create `.env.local` with real values (this file is gitignored).

---

## Git Commit & Push

After all code is written and verified locally:

```bash
git add -A && git commit -m "feat: initial Screenshot API — endpoints, landing page, docs, pricing" && git push origin dev
```

**DO push to dev.** This triggers a Vercel preview deployment. JK will review the preview URL, then open a PR from dev → main on GitHub for production deploy.

---

## Smoke Tests

| # | Scenario | Steps | Expected Result | Pass/Fail |
|---|----------|-------|-----------------|-----------|
| 1 | Health check | GET /api/v1/health | Returns { status: "ok", version: "1.0.0" } | |
| 2 | Basic screenshot | POST /api/v1/capture with url: "https://example.com" and demo key | Returns success with base64 PNG image | |
| 3 | Missing API key | POST /api/v1/capture without x-api-key header | Returns 401 with AUTH_REQUIRED error | |
| 4 | Invalid API key | POST /api/v1/capture with x-api-key: "fake_key" | Returns 401 with INVALID_API_KEY error | |
| 5 | Invalid URL | POST /api/v1/capture with url: "not-a-url" | Returns 400 with INVALID_URL error | |
| 6 | JPEG format | POST with format: "jpeg", quality: 90 | Returns JPEG image, smaller than PNG | |
| 7 | Mobile device | POST with device: "mobile" | Returns screenshot with ~390px width viewport | |
| 8 | Full page capture | POST with url: any long page, full_page: true | Returns tall image capturing entire page | |
| 9 | Dark mode | POST with dark_mode: true on a site that supports it | Returns screenshot in dark color scheme | |
| 10 | GET method | GET /api/v1/capture?url=https://example.com with x-api-key header | Same result as POST | |
| 11 | Landing page loads | Visit / in browser | Landing page renders with hero, features, demo | |
| 12 | Docs page loads | Visit /docs in browser | Docs page renders with API tester, parameter table | |
| 13 | Pricing page loads | Visit /pricing in browser | Pricing page renders with 4 tiers | |
| 14 | Interactive demo works | On landing page, paste URL, click Capture | Screenshot appears in the demo area | |
| 15 | Rate limit works | Send 11+ requests in 1 minute with free tier key | 11th request returns 429 RATE_LIMIT_EXCEEDED | |

---

## What Comes Next

After this API is deployed and verified:
1. JK reviews at the Vercel preview URL
2. JK opens PR from dev → main on GitHub
3. JK merges → live at screenshot.endpnt.dev
4. JK lists on RapidAPI for distribution
5. Move to Part 2: QR Code API (separate spec)
