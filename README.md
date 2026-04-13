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

### Health Check
```
GET /api/v1/health
```
Returns API status and version information.

### Screenshot Capture
```
POST /api/v1/capture
GET /api/v1/capture
```

**Authentication**: Include `x-api-key` header with your API key.

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | required | URL to screenshot (must be http/https) |
| `format` | string | "png" | Output format: "png", "jpeg", "webp", "pdf" |
| `width` | number | 1280 | Viewport width (320-3840) |
| `height` | number | 720 | Viewport height (320-2160) |
| `full_page` | boolean | false | Capture entire scrollable page |
| `wait_for` | number | 0 | Milliseconds to wait after load (max 10000) |
| `selector` | string | null | CSS selector to capture specific element |
| `quality` | number | 80 | JPEG/WebP quality (1-100) |
| `dark_mode` | boolean | false | Emulate dark color scheme |
| `device` | string | "desktop" | Device preset: "desktop", "mobile", "tablet" |

**Response Format**:
```json
{
  "success": true,
  "data": {
    "image": "base64_encoded_image_data...",
    "width": 1280,
    "height": 720,
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

**Error Codes**:
- `AUTH_REQUIRED` (401) - Missing API key
- `INVALID_API_KEY` (401) - Invalid or expired key
- `RATE_LIMIT_EXCEEDED` (429) - Rate limit exceeded
- `INVALID_URL` (400) - Malformed URL
- `INVALID_PARAMS` (400) - Parameter validation failed
- `CAPTURE_FAILED` (500) - Screenshot capture failed
- `TIMEOUT` (504) - Page load timeout

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

## Rate Limits

| Tier | Requests/minute | Requests/month | Price |
|------|-----------------|----------------|-------|
| Free | 10 | 100 | $0 |
| Starter | 60 | 5,000 | $29/mo |
| Pro | 300 | 25,000 | $99/mo |
| Enterprise | 1,000 | 100,000 | Contact us |

## Examples

### Basic Screenshot
```bash
curl -X POST https://screenshot.endpnt.dev/api/v1/capture \
  -H "x-api-key: ek_live_demo123" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Mobile Screenshot with Custom Settings
```bash
curl -X POST https://screenshot.endpnt.dev/api/v1/capture \
  -H "x-api-key: ek_live_demo123" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "device": "mobile",
    "format": "jpeg",
    "quality": 90,
    "dark_mode": true
  }'
```

### Full Page JPEG
```bash
curl -X POST https://screenshot.endpnt.dev/api/v1/capture \
  -H "x-api-key: ek_live_demo123" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "full_page": true,
    "format": "jpeg",
    "quality": 95
  }'
```

### Element Screenshot
```bash
curl -X POST https://screenshot.endpnt.dev/api/v1/capture \
  -H "x-api-key: ek_live_demo123" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "selector": ".main-content",
    "width": 1920,
    "height": 1080
  }'
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

**Phase 3 (Frontend Pages)** ✅ Complete
- ✅ Landing page with interactive demo
- ✅ API documentation page with interactive tester
- ✅ Pricing tiers page with 4-tier comparison

**Phase 4 (Polish & Edge Cases)** ✅ Complete
- ✅ URL normalization and validation
- ✅ Parameter clamping and validation
- ✅ Comprehensive error handling
- ✅ Timeout and selector handling
- ✅ README documentation update

## Tech Stack

- **Framework**: Next.js 14+ App Router
- **Language**: TypeScript
- **Browser**: Playwright + @sparticuz/chromium-min (Vercel compatible)
- **Rate Limiting**: Upstash Redis + @upstash/ratelimit
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
