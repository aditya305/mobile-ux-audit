# Mobile UX Audit — FitTrack (example)

> **This is a sample report** on a fictional React Native fitness app, showing the output
> shape a real audit produces. Five findings, one of each flavor.

**Date:** 2026-07-02  ·  **Stack:** React Native / Expo (Expo Router)  ·  **Scope:** 4 screens
(`app/index.tsx`, `app/login.tsx`, `app/workouts.tsx`, `app/settings.tsx`)

## Summary
- **P0 (Blocker):** 1   **P1 (Major):** 2   **P2 (Minor):** 2   **P3 (Nit):** 0
- **Top 3 to fix now:**
  1. F1 — Workouts screen renders blank while fetching and crashes on network error
  2. F2 — Icon-only header buttons have no accessibility labels (4 screens)
  3. F3 — Login submit button gives no feedback and allows double-submit

## Findings
Sorted P0 → P3.

| ID | Sev | Conf | Screen | Category | Evidence | Issue | Recommended fix | Effort |
|----|-----|------|--------|----------|----------|-------|-----------------|--------|
| F1 | P0 | verified | Workouts | State coverage | `app/workouts.tsx:31` | Only the populated state is rendered; no loading/empty/error branches — blank screen while fetching, red-box on fetch failure | Add loading skeleton, empty state with CTA, error state with retry | M |
| F2 | P1 | verified | All | Accessibility | `components/HeaderIcon.tsx:12` | Icon-only `Pressable`s have no `accessibilityLabel`/`accessibilityRole` — invisible to screen readers. Affects: `app/index.tsx:18`, `app/workouts.tsx:14`, `app/settings.tsx:9` | Add `accessibilityLabel` + `accessibilityRole="button"` to `HeaderIcon`; one fix covers all call sites | S |
| F3 | P1 | verified | Login | Forms & input | `app/login.tsx:58` | Submit handler has no in-flight state — no spinner, button stays active, taps queue duplicate requests | Track `isSubmitting`; disable button + show `ActivityIndicator` while pending | S |
| F4 | P2 | likely | Settings | Touch targets | `app/settings.tsx:44` | Toggle rows are `height: 36` — below the 44pt iOS minimum; padding may compensate, confirm on device | Raise row `minHeight` to 44 (or add `hitSlop`) | S |
| F5 | P2 | needs-runtime | Login | Accessibility | `app/login.tsx:23` | Placeholder gray `#9CA3AF` on white is ~2.8:1 — likely fails 4.5:1 contrast for the placeholder-as-label pattern | Add a real label above the field; darken placeholder | S |

### F1 — Workouts screen only renders the happy path (P0, verified)
- **Where:** `app/workouts.tsx:31`
- **Heuristic:** Nielsen #1 — Visibility of system status
- **Problem:** While `useWorkouts()` fetches, the screen is blank; if the request fails the
  error is unhandled. A first-time user on a slow connection sees nothing and assumes the app
  is broken.
- **Fix:** Branch on the query state: skeleton list while loading, "No workouts yet — start
  one" empty state, and an error card with a Retry button.
- **Effort:** M

### F5 — Placeholder-as-label with weak contrast (P2, needs-runtime)
- **Where:** `app/login.tsx:23`
- **Heuristic:** WCAG 1.4.3 Contrast (Minimum)
- **Problem:** The email field relies on a light-gray placeholder as its only label; contrast is
  likely below 4.5:1 and the label disappears once the user types.
- **Fix:** Add a persistent label above the input; darken the placeholder to `#6B7280` or darker.
- **Effort:** S
- **Verify:** Screenshot the field and check the exact ratio in a contrast checker (WebAIM).

## Ticket export (with --tickets)

```markdown
### [P0][UX] Workouts screen blank while loading, crashes on fetch error
**Screen:** Workouts · **Category:** §2.2 State coverage · **Effort:** M · **Confidence:** verified
**Evidence:** `app/workouts.tsx:31`
**Problem:** Only the populated state renders — blank screen during fetch, unhandled error on failure.
**Fix:** Add loading skeleton, empty state with CTA, error state with retry.
_From mobile UX audit 2026-07-02 — finding F1_
```

## Not audited / assumptions
- `app/profile.tsx` skipped — behind a feature flag that is off in this build.
- Exact contrast ratios (F5) and rendered row height (F4) need device verification.
