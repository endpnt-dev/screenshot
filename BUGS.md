# BUGS.md — Screenshot API Bug Tracker

**Scope:** Bugs specific to the Screenshot API (`screenshot.endpnt.dev`). Cross-cutting bugs live at `../BUGS.md`.

**ID prefix:** `S-NNN` (sequential, do not reuse).

**Last updated:** 2026-04-24.

---

## Open bugs

### S-001 — SSRF unprotected on URL input — CONFIRMED launch blocker

- **Severity:** High (CONFIRMED launch blocker — audit 2026-04-24)
- **Files:** `app/api/v1/capture/route.ts`, `lib/url-utils.ts` (if it exists — confirm during fix)
- **Discovered:** 2026-04-24 (captured as TODO in `screenshot/CLAUDE.md`; CONFIRMED by biweekly code health audit 2026-04-24)
- **Symptom — CONFIRMED:** Screenshot is the **highest-impact SSRF surface on the platform** because Chromium renders the target URL fully. Audit confirmed:
  - `validateUrl()` in the capture route is **format-only** — checks URL syntax and scheme (`http`/`https`) but performs no hostname or IP validation.
  - Localhost (`http://localhost/...`) is **not blocked** — the scheme check accepts any http/https URL.
  - No private-IP blocklist, no DNS-based validation, no call to `isSSRFProtected()` before `page.goto()`.
  - An attacker can submit `http://169.254.169.254/latest/meta-data/` and receive a PNG screenshot of the AWS IMDS response, potentially exposing IAM credentials, user-data scripts, and instance identity documents.
- **Root cause:** SSRF protection was established in Preview after Screenshot was built. Screenshot was never retrofitted. The `validateUrl()` function was written as a URL-format guard, not a security control.
- **Impact:** Fully exploitable SSRF — Chromium renders whatever URL it's given. An attacker who can reach Screenshot's API (any free-tier user) can probe the internal network from Vercel's egress IP. Pre-launch blocker. Would be a CVE disclosure event if exploited post-launch.
- **Fix approach:**
  1. Copy `preview/lib/url-utils.ts` `isSSRFProtected()` into `screenshot/lib/url-utils.ts`.
  2. Call `isSSRFProtected(url)` in the capture route **before** any browser launch or `page.goto()` call.
  3. **Critical detail:** Chromium internally follows redirects. Preview's `redirect: 'manual'` pattern doesn't port to Playwright. Best options for redirect protection:
     - (a) **DNS pre-validation** (simplest): Resolve URL hostname via DNS, block if any returned IP is private/loopback/link-local. This is the same approach as QR v2 `fetchImage()` — stronger than format-only but doesn't protect against fast-redirect attacks.
     - (b) **Playwright request interception**: Use `page.route('**')` to intercept every navigation and sub-resource, validate each URL before allowing. More complete but adds latency.
     - (c) **Playwright proxy**: Route all browser traffic through a filtering proxy. Most complete but adds infrastructure.
     - Recommend option (a) as the minimum viable fix; note that (b) or (c) are better long-term for a browser-rendering API.
  4. Add `BLOCKED_URL` error code to `lib/config.ts` `ERROR_CODES`.
  5. Add smoke tests for `169.254.169.254`, `127.0.0.1`, `10.0.0.1`, and `::1` (IPv6 loopback).
  6. Update `screenshot/CLAUDE.md` to remove the SSRF TODO and note the protection mechanism used.
- **Cross-reference:** `../BUGS.md#P-003` (highest-priority SSRF gap on the platform; same class as Q-001 v1, B-001, PDF-003–007)
- **Status:** Open. CONFIRMED launch blocker. Write fix spec before next deployment.

### S-002 — Loose test fixture at repo root

- **Severity:** Low
- **File:** `test-screenshot.png` at repo root
- **Discovered:** Pre-2026-04-24 (flagged in `screenshot/CLAUDE.md`)
- **Symptom:** A `.png` file sits at repo root. Likely a test fixture or an ad-hoc screenshot from development.
- **Impact:** Clutter. If it's gitignored, no actual impact on the repo, but it appears in directory listings.
- **Fix approach:** Verify whether it's gitignored. If not, either move to `tests/fixtures/` (if used by any test) or delete.
- **Cross-reference:** `../BUGS.md#P-004`
- **Status:** Open. Opportunistic cleanup.

---

## Resolved bugs

*(None resolved yet.)*
