# Mobile UX Audit — agent instructions

> This file makes the audit usable by any agent that reads an `AGENTS.md` / rules file
> (Cursor, GitHub Copilot Workspace, Windsurf, etc.). It points to the same portable brain
> the Claude skill uses, so behavior is identical across tools.

## When to run
When the user asks to review, audit, critique, or improve the **UX/UI, accessibility,
usability, visual polish, loading/empty/error states, tap targets, or platform fit** of a
mobile app (React Native/Expo, Flutter, SwiftUI/UIKit, Jetpack Compose/XML, Kotlin
Multiplatform, .NET MAUI/Xamarin, Ionic/Capacitor/Cordova, or a PWA).

## How to run
1. Read and follow **`playbook/ux-audit-playbook.md`** in order — it is the full method.
   For large apps (~10+ screens) use **Section 6 (batch mode)**: audit in batches, keep findings
   in a `ux-audit-findings.md` ledger on disk, hold only one batch in context at a time.
   Optionally run **Step 2.5 (trace app structure)** first — statically read the stack's
   routing/nav config (and GraphQL schema if present) to order batches by real user flow. It
   supports all four stacks and falls back to plain file inventory if tracing is ambiguous.
2. Pull in `references/*.md` as needed (stack detection, heuristics, platform guidelines).
3. Output a report using `templates/audit-report-template.md`.
4. Only modify code if the user explicitly asks to fix — UX changes only, preserve behavior
   and existing style, cite the finding each change resolves.

## Guardrails
- Every finding cites `file:line` or a screenshot region.
- Audit only screens that exist; state assumptions when the stack is ambiguous.
- Report-only by default; fix only on explicit request.
