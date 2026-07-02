# Mobile UX Audit — <App / Screen name>

**Date:** <YYYY-MM-DD>  ·  **Stack:** <detected stack>  ·  **Scope:** <screens/files or screenshots audited>

## Summary
<!-- Only if a previous ux-audit-findings.md ledger exists (re-audit): -->
- **Δ since last audit (<date>):** <n> fixed · <n> new · <n> regressed · <n> still open
- **P0 (Blocker):** <n>   **P1 (Major):** <n>   **P2 (Minor):** <n>   **P3 (Nit):** <n>
- **Top 3 to fix now:**
  1. <finding id> — <one line>
  2. <finding id> — <one line>
  3. <finding id> — <one line>

## Findings
Sorted P0 → P3.

| ID | Sev | Conf | Screen | Category | Evidence | Issue | Recommended fix | Effort |
|----|-----|------|--------|----------|----------|-------|-----------------|--------|
| F1 | P0 | verified | <screen> | State coverage | `src/…:42` | <what's wrong> | <concrete change> | S |
| F2 | P1 | likely | <screen> | Accessibility | `src/…:88` | … | … | M |

Conf = confidence: **verified** (read the code, certain) · **likely** (pattern match, confirm) ·
**needs-runtime** (verify on device — see the how-to-verify note in the finding).

<!-- For each finding, optionally expand below with more detail: -->

### F1 — <short title> (P0, verified)
- **Where:** `src/…:42`
- **Heuristic:** <e.g. Nielsen #1 Visibility of system status>
- **Problem:** <what the user experiences>
- **Fix:** <specific change in this codebase's idiom>
- **Effort:** S / M / L
- **Verify:** <only for likely/needs-runtime — the fastest way to confirm, e.g. "Accessibility Inspector → contrast audit">

## Fixes applied (only if --fix / fixing was requested)
One reviewable unit per finding — commit `fix(ux): <id> — <title>` or a delimited diff.

| Finding | File | Change (before → after) | Checklist item satisfied | Verified |
|---------|------|-------------------------|--------------------------|----------|
| F1 | `src/…` | happy-path-only render → added loading + error branches | §2.2 State coverage | ✅ |

## Ticket export (only if --tickets was requested)
One block per P0/P1 finding, paste-ready for GitHub/Jira. P2/P3 grouped into one
"UX polish backlog" block.

```markdown
### [P1][UX] <short title>                      <!-- issue title -->
**Screen:** <screen> · **Category:** <§2.x category> · **Effort:** S/M/L · **Confidence:** verified
**Evidence:** `src/…:42`
**Problem:** <what the user experiences>
**Fix:** <concrete change in this codebase's idiom>
**Verify:** <how to confirm the fix on device, if needs-runtime>
_From mobile UX audit <YYYY-MM-DD> — finding F1_
```

## Not audited / assumptions
- <screens skipped and why>
- <assumptions made, things to verify manually — e.g. exact contrast ratios, runtime behavior>
