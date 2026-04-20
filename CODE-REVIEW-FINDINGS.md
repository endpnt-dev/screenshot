# Screenshot API — Code Review Findings (endpnt-dev/screenshot)
**Reviewed by:** Opus (Claude chat) — cross-repo code review
**Date:** April 17, 2026
**Scope reviewed:** `app/api/v1/*`, `lib/*`, `.gitignore`, `.env.example`

---

## Critical issues

### C1 — Rate-limit namespace missing API identifier (collision risk)
**File:** `lib/rate-limit.ts` (4 locations — lines ~32, 40, 48, 56)

Screenshot uses bare `rl:free` / `rl:starter` / `rl:pro` / `rl:enterprise` prefixes in Upstash. Every other API in the platform uses `rl:{apiName}:{tier}` (QR uses `rl:qr:*`, Preview uses `rl:preview:*`, Convert uses `rl:convert:*`).

**Risk:** Any future API added with a bare `rl:{tier}` prefix would collide with Screenshot's counters and share rate limit buckets with Screenshot. Not exploitable today, but is a latent bug.

**Fix:** Already written as a standalone micro spec — `CC-SPEC-RATELIMIT-FIX.md` in this repo. Execute when convenient.

---

## Correctness issues

### M1 — Demo landing-page fetch uses hardcoded frontend key, same bug as QR
**Files:** `app/components/ApiTester.tsx:40`, `app/components/ApiTester.tsx:106`, `app/components/ScreenshotDemo.tsx:44`, `app/docs/page.tsx:124`, `app/docs/page.tsx:287`

Five hardcoded references to `ek_live_74qlNSbK5jTwq28Y` (current demo key) plus `ek_live_demo123` (stale placeholder). Pattern A, same issue as QR. One of the keys (`ek_live_demo123`) doesn't exist in `API_KEYS` — that's why the docs page tester returns INVALID_API_KEY.

**This is likely WHY the CIC audit found the Screenshot landing demo failing with 401.** The component is sending `ek_live_74qlNSbK5jTwq28Y` but the currently-deployed API_KEYS env var doesn't include that key anymore (it was rotated at some point).

**Recommended fix (short-term):** Update the hardcoded key in all 5 locations to a key that actually exists in the current `API_KEYS` env var. This unblocks the demo immediately but is still Pattern A.

**Recommended fix (long-term):** Migrate Screenshot to Pattern B (the Cipher/Color approach). A server-side demo endpoint at `/api/demo/capture` that reads `DEMO_API_KEY` from env and injects it — no frontend key exposure. Part of the platform-wide Pattern B migration post-Cipher.

### M2 — Screenshot landing page demo has no options (UX regression)
**File:** `app/components/ScreenshotDemo.tsx`

The CIC audit noted:

> The landing demo offers no format/device/full-page/dark-mode toggles at all — the only input is the URL field.

The docs page (`ApiTester.tsx`) has all of these toggles. The landing demo doesn't. This makes it impossible for a first-time visitor to experience any differentiated feature on the landing page — they can only see the most basic screenshot capability, which offers no reason to choose this API over any other.

**Recommended fix:** Add at least 2 toggles to the landing demo — format (PNG/JPEG) and device (desktop/mobile) would give the demo enough surface to showcase the product. Full-page and dark-mode can stay in the docs tester for power users.

### M3 — Chromium error handling is broad and may mask real bugs
**File:** `app/api/v1/capture/route.ts` (lines ~178-188)

```ts
if (
  message.includes('Failed to launch') ||
  message.includes('browser') ||
  message.includes('executable') ||
  message.includes('spawn') ||
  message.includes('ENOENT')
) {
  return errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Server temporarily overloaded. Please retry in a moment.', 503, ...);
}
```

Matching on `message.includes('browser')` is too broad — any error message containing the word "browser" (including "Invalid browser device preset") would be classified as a Chromium launch failure and return 503. This could mask legitimate 400-level errors as retryable server errors.

**Recommended fix:** Use more specific matches. E.g., match only `Failed to launch` or `ENOENT`. Drop the `browser` and `executable` substring matches.

### M4 — GET method doesn't accept `api_key` query parameter
**File:** `app/api/v1/capture/route.ts` (auth check, line ~98)

QR v1 route accepts both `x-api-key` header AND `?api_key=` query string for GET requests. Screenshot v1 only accepts the header. Inconsistency.

```ts
// QR:
if (!apiKey && request.method === 'GET') {
  const url = new URL(request.url)
  apiKey = url.searchParams.get('api_key')
}

// Screenshot:  (missing this block)
```

**Recommended fix:** Add the same query-string fallback to Screenshot for parity with QR. Useful for users who want to embed a screenshot URL directly in an `<img>` tag.

---

## Polish / consistency issues

### P1 — `.env.example` uses real-looking `ek_live_` prefix in placeholder
**File:** `.env.example` (line 3)

```
API_KEYS={"ek_live_demo123":{"tier":"free","name":"Demo Key"}}
```

Same issue as QR's P2. Use `ek_test_` or `ek_placeholder_` instead of `ek_live_` in example files.

### P2 — `test-api.js` is committed but not gitignored
**File:** `test-api.js` (repo root)

The file exists locally and is tracked by git. It's a manual test harness — fine to keep but ideally in a `scripts/` or `tests/` folder rather than the repo root. Minor hygiene.

### P3 — No `api_key_info` returned in auth success response
**File:** `app/api/v1/capture/route.ts`

Other APIs (Validate) include rate-limit remaining counts in response headers (`X-RateLimit-Remaining`). Screenshot includes them in the response body (`meta.remaining_credits`). Different conventions. Either is fine but the platform should pick one.

Flagging for platform-wide consistency discussion later, not a Screenshot-specific bug.

### P4 — `getApiKeyFromHeaders` doesn't `.trim()` the key
**File:** `lib/auth.ts`

QR's version does `return key ? key.trim() : null`. Screenshot's doesn't. If a user copy-pastes their API key with trailing whitespace (common on mobile), Screenshot rejects it while QR accepts it.

**Recommended fix:** Add `.trim()` to match QR.

---

## Security considerations

### S1 — Screenshot fetches arbitrary URLs (Chromium does) — SSRF exposure
**File:** `lib/screenshot.ts` (not read deeply, inferred from route handler)

Screenshot navigates to any URL the user provides. This is inherent to the product — you can't offer a screenshot API without loading the URL. However, there's no mention in my read of SSRF protection against private IPs (e.g., 127.0.0.1, 10.0.0.0/8, 169.254.169.254 AWS metadata endpoint).

If a customer submits `http://169.254.169.254/latest/meta-data/iam/security-credentials/`, your Chromium instance would fetch AWS IMDS credentials and render them as a screenshot. Game over if Vercel exposes IMDS (it might not, but worth checking).

**Recommended fix:** Read `lib/screenshot.ts` and confirm whether Playwright/Chromium blocks private IPs by default. If not, add an explicit SSRF protection layer like Preview has (`preview/lib/url-utils.ts`). This is a real security item, not cosmetic — flagging as S1 for priority.

### S2 — Error messages from Chromium propagated verbatim to users
**File:** `app/api/v1/capture/route.ts` (line ~140-175)

Multiple code paths return `error.message` directly in the response body. Chromium/Playwright error messages sometimes leak internal paths, stack frames, or timing info. Low-severity info disclosure.

**Recommended fix:** For 500-level errors, return generic messages. Keep detailed messages in server logs only.

---

## Suggested fix specs (priority ordered)

1. **S1 — SSRF confirmation / hardening.** Investigate `lib/screenshot.ts` for existing SSRF protection. If none, write a full spec adding a private-IP blocklist similar to Preview's. This is security-critical.
2. **C1 — Rate-limit namespace fix.** Already written as `CC-SPEC-RATELIMIT-FIX.md`. Execute.
3. **M1 — Fix demo keys (short-term).** Update hardcoded keys to match current API_KEYS env var. Unblocks the landing demo. 5 minutes of work.
4. **M3 — Tighten Chromium error matching.** Micro spec, 5 lines.
5. **M4 — Add query-string API key support.** Micro spec, 5 lines.
6. **M2 — Add format/device toggles to landing demo.** Small UI change, 15-20 minutes.
7. **P1, P2, P3, P4 — Cosmetic batch.** 15 minutes.

M1 is deferred long-term to the Pattern B migration post-Cipher.

---

## Review notes for CC review-qa-agent

When running CC's `review-qa-agent` on the Screenshot repo:

1. **Confirm S1.** Open `lib/screenshot.ts` and determine whether SSRF protection exists. Report back with evidence — either "protection exists at line X" or "no SSRF protection found." This is the highest-priority question.
2. **Check Chromium config.** Confirm whether `@sparticuz/chromium-min` or similar is configured, and whether Vercel Pro (50MB function size) is required.
3. **Verify the demo key fix works before committing M1.** Run a curl against the deployed API with the proposed new key to confirm it's valid before pushing frontend changes that embed it.
4. **Look for dead code in `lib/screenshot.ts`.** I didn't read that file. There may be unused helpers or deprecated paths worth cleaning up.
5. **Re-run the smoke tests** from `CC-SPEC-RATELIMIT-FIX.md` after any changes.
