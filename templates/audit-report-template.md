# Mobile UX Audit — <App / Screen name>

**Date:** <YYYY-MM-DD>  ·  **Stack:** <detected stack>  ·  **Scope:** <screens/files or screenshots audited>

## Summary
- **P0 (Blocker):** <n>   **P1 (Major):** <n>   **P2 (Minor):** <n>   **P3 (Nit):** <n>
- **Top 3 to fix now:**
  1. <finding id> — <one line>
  2. <finding id> — <one line>
  3. <finding id> — <one line>

## Findings
Sorted P0 → P3.

| ID | Sev | Screen | Category | Evidence | Issue | Recommended fix | Effort |
|----|-----|--------|----------|----------|-------|-----------------|--------|
| F1 | P0 | <screen> | State coverage | `src/…:42` | <what's wrong> | <concrete change> | S |
| F2 | P1 | <screen> | Accessibility | `src/…:88` | … | … | M |

<!-- For each finding, optionally expand below with more detail: -->

### F1 — <short title> (P0)
- **Where:** `src/…:42`
- **Heuristic:** <e.g. Nielsen #1 Visibility of system status>
- **Problem:** <what the user experiences>
- **Fix:** <specific change in this codebase's idiom>
- **Effort:** S / M / L

## Fixes applied (only if --fix / fixing was requested)
| Finding | File | Change | Verified |
|---------|------|--------|----------|
| F1 | `src/…` | Added loading + error branches | ✅ |

## Not audited / assumptions
- <screens skipped and why>
- <assumptions made, things to verify manually — e.g. exact contrast ratios, runtime behavior>
