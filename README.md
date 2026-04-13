# Screenshot API

Capture any webpage as PNG, JPEG, WebP, or PDF with a simple API call.

## Features

- **Multiple formats**: PNG, JPEG, WebP, PDF support
- **Device emulation**: Desktop, mobile, tablet presets
- **Full-page capture**: Capture entire scrollable pages
- **Element targeting**: Screenshot specific elements via CSS selector
- **Dark mode**: Emulate dark color schemes
- **Rate limiting**: Built-in rate limits by tier
- **Fast & reliable**: Powered by Playwright and Chromium

## Quick Start

```bash
curl -X POST https://screenshot.endpnt.dev/api/v1/capture \
  -H "x-api-key: ek_live_demo123" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## API Endpoints

- `GET /api/v1/health` - Health check
- `POST /api/v1/capture` - Take screenshot
- `GET /api/v1/capture` - Take screenshot (query params)

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
API_KEYS={"ek_live_demo123":{"tier":"free","name":"Demo Key"}}
NEXT_PUBLIC_SITE_URL=https://screenshot.endpnt.dev
```

## Development

```bash
npm install
npm run dev
```

## Implementation Status

**Phase 0 (Scaffolding)** ✅ Complete
- ✅ Next.js 14+ with TypeScript 
- ✅ Tailwind CSS with dark theme
- ✅ Vercel configuration for Chromium
- ✅ Environment setup

**Phase 1 (lib/ layer)** ✅ Complete
- ✅ `lib/config.ts` - Constants, tier limits, device presets
- ✅ `lib/response.ts` - Success/error response factories
- ✅ `lib/auth.ts` - API key validation from JSON env var
- ✅ `lib/rate-limit.ts` - Upstash Redis rate limiting
- ✅ `lib/screenshot.ts` - Playwright + Chromium screenshot capture

**Phase 2 (API Routes)** ✅ Complete
- ✅ `app/api/v1/health/route.ts` - Health check endpoint
- ✅ `app/api/v1/capture/route.ts` - Screenshot capture (GET + POST)
- ✅ `middleware.ts` - CORS handling

**Phase 3 (Frontend Pages)** 🚧 In Progress
- 🚧 Landing page with interactive demo
- 🚧 API documentation page
- 🚧 Pricing tiers page

## Tech Stack

- **Framework**: Next.js 14+ App Router
- **Language**: TypeScript
- **Browser**: Playwright + @sparticuz/chromium-min (Vercel compatible)
- **Rate Limiting**: Upstash Redis + @upstash/ratelimit
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
