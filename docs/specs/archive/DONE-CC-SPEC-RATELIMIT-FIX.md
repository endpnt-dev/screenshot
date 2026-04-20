# endpnt.dev — Cross-Repo Rate Limit Fix (Micro Spec)
**Version:** 1.0
**Date:** April 17, 2026
**Author:** Opus
**Scope:** Affects 5 repos — screenshot, qr, preview, convert, validate
**Priority:** Polish (consistency fix, not blocking)

---

## ⚠️ Before starting

Read CLAUDE.md in each target repo before editing. Follow all rules — Definition of Done, mandatory workflow, honest reporting.

This spec touches **5 separate repos**. Do them sequentially, one at a time. Commit and push per repo. Do NOT try to batch commits across repos.

**Agent workflow:** This is a micro spec (single file per repo, <20 lines of changes each). CC may edit directly, BUT `review-qa-agent` MUST be invoked before commit in each repo.

---

## Background

A cross-repo review found two rate-limiting inconsistencies across the five API repos:

1. **Screenshot's rate-limit prefix is missing the API name.** It uses `rl:free` / `rl:starter` / `rl:pro` / `rl:enterprise`, while QR/Preview/Convert use `rl:{apiName}:{tier}` and Validate uses `@upstash/ratelimit:validate:{tier}`. If any future API uses the same plain `rl:{tier}` format, counters collide.

2. **Validate uses a different config shape and algorithm than the other four.** The other four use `TIER_LIMITS.{tier}.requests_per_minute` + `Ratelimit.slidingWindow(...)`. Validate uses `RATE_LIMITS[tier].requests` + `RATE_LIMITS[tier].window` + `Ratelimit.fixedWindow(...)`. Different shape, different algorithm. This is more than a naming fix and is called out as a separate follow-up at the end of this spec.

This spec addresses only **issue 1** tonight. Issue 2 is a larger refactor and is out of scope — flagged as a future item.

**Important context for architect:** The "starter" tier exists in QR/Screenshot/Preview/Convert's `TIER_LIMITS` but not in Validate's `RATE_LIMITS` (Validate only has free/pro/enterprise). Do not introduce "starter" into Validate as part of this spec.

---

## Change: Screenshot namespace fix

**File:** `C:\Repositories\endpnt\screenshot\lib\rate-limit.ts`

Four `prefix:` values need to include `screenshot:` in the namespace to match the pattern used by QR, Preview, and Convert.

### FIND (current, 4 places in file):

```ts
        prefix: 'rl:free',
```

```ts
        prefix: 'rl:starter',
```

```ts
        prefix: 'rl:pro',
```

```ts
        prefix: 'rl:enterprise',
```

### REPLACE WITH:

```ts
        prefix: 'rl:screenshot:free',
```

```ts
        prefix: 'rl:screenshot:starter',
```

```ts
        prefix: 'rl:screenshot:pro',
```

```ts
        prefix: 'rl:screenshot:enterprise',
```

### Why
Aligns Screenshot's Upstash key namespace with the other three slidingWindow-based APIs (QR uses `rl:qr:*`, Preview uses `rl:preview:*`, Convert uses `rl:convert:*`). Prevents future naming collisions if another API is added using the bare `rl:{tier}` pattern.

### Side effect to be aware of
**All currently-in-flight free/starter/pro/enterprise rate-limit counters for Screenshot will reset.** Any user currently at the edge of their rate limit will get a fresh counter as soon as this deploys. This is acceptable because (a) the platform has no paying users yet and (b) the alternative is permanent namespace drift.

---

## Verify (Screenshot)

1. `grep -n "prefix: 'rl:" app/ lib/ --include="*.ts" -r` (adjust path if needed) should return 4 lines, all with `rl:screenshot:`.
2. `npm run build` exits 0 (MANDATORY before commit).
3. After deploy, make one authenticated request to `/api/v1/capture` with a valid demo key — should succeed. The rate-limiter reset is expected behavior, not a regression.

---

## Git (Screenshot)

```bash
cd /mnt/c/Repositories/endpnt/screenshot
npm run build   # Must exit 0
git add lib/rate-limit.ts
git commit -m "fix: add screenshot:* prefix to rate-limit Upstash namespaces"
git push origin main
```

---

## Agent Invocation (mandatory)

Before committing in each repo:
- Launch `review-qa-agent` with the diff
- Address any concerns raised
- Only then run the build and commit

---

## Smoke Tests (against deployed screenshot.endpnt.dev)

| # | Scenario | Steps | Expected | Pass/Fail |
|---|----------|-------|----------|-----------|
| 1 | Authenticated request works | `curl -X POST https://screenshot.endpnt.dev/api/v1/capture -H "x-api-key: $DEMO_KEY" -H "Content-Type: application/json" -d '{"url":"https://example.com"}'` | HTTP 200 with screenshot base64 in response | |
| 2 | Rate limit still enforced | Send 11 requests in <1 min with a free-tier key | 11th returns HTTP 429 with `RATE_LIMIT_EXCEEDED` | |
| 3 | Upstash namespace correct | Inspect Upstash dashboard → Data Browser → search prefix `rl:screenshot:` | See live counter keys matching the new prefix | |

---

## Status Report Required (Screenshot)

```
✅/❌ review-qa-agent invoked, findings: [list or "none"]
✅/❌ npm run build exit code: [0 or N]
✅/❌ grep -n "prefix: 'rl:" returns 4 results, all with screenshot:* namespace
Commit hash pushed: [hash]
Vercel deployment status: green | red | pending
Smoke test results: X of 3 pass
```

---

## Why the other 4 repos are NOT changed

**QR** (`rl:qr:free` etc.) — already correct, uses `rl:qr:*` namespace.

**Preview** (`rl:preview:free` etc.) — already correct.

**Convert** (`rl:convert:free` etc.) — already correct.

**Validate** (`@upstash/ratelimit:validate:free` etc.) — namespace is already API-specific. Validate uses a *different format* (`@upstash/ratelimit:` prefix with `validate:` suffix) but is not colliding with anything. Leave as-is tonight; reconsider during the Issue 2 follow-up below.

---

## Issue 2 (Future Follow-Up — NOT in scope tonight)

Validate's rate-limiting shape diverges from the other four APIs in three ways:

1. **Config shape.** Uses `RATE_LIMITS[tier] = { requests, window }` instead of `TIER_LIMITS[tier] = { requests_per_minute, requests_per_month }`.
2. **Algorithm.** Uses `Ratelimit.fixedWindow()` instead of `Ratelimit.slidingWindow()`.
3. **Tier set.** Exposes `free / pro / enterprise` only. No `starter` tier.

Together these mean Validate has subtly different rate-limiting behavior than its sister APIs and can't be touched without also normalizing pricing tiers and recalibrating the per-day-vs-per-minute numbers.

Recommended treatment: write a future spec that (a) aligns Validate's config shape to the `TIER_LIMITS` format, (b) switches Validate to `slidingWindow` for consistency, and (c) decides whether Validate gets a `starter` tier. Tag for the polish-pass sprint after Cipher and Color ship.

---

## Also out of scope tonight

- **Monthly quota enforcement.** All 5 APIs advertise monthly limits (e.g., "100 requests/month" on Free) but NONE actually enforce monthly quotas in code. Only per-minute limits are checked. This is a platform-wide issue requiring a monthly-window rate limiter. Document it here, fix it in a future dedicated spec.

- **Consolidated limits across APIs.** Current architecture is per-API limits (a free user can do 10/min × 5 APIs = 50/min total). This is the correct and intentional pattern for a multi-API platform. Do not change.

---

## ✅ Completion Record

- **Completed:** 2026-04-20
- **Final commit:** 50e0abc
- **Vercel deployment:** pending verification
- **Agents invoked:** review-qa-agent
- **Smoke tests:** pending deployment
- **Notes:** Successfully changed 4 prefix values in lib/rate-limit.ts from rl:{tier} to rl:screenshot:{tier}. Build passed locally. Only Screenshot required changes - other 4 APIs already had correct namespaces as documented in the spec.