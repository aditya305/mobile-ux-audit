---
name: audit-ux
description: Audit the UX of a mobile app (React Native/Expo, Flutter, SwiftUI/UIKit, Jetpack Compose/XML, Kotlin Multiplatform, .NET MAUI/Xamarin, Ionic/Capacitor/Cordova, PWA) and optionally fix the issues. Use when the user wants to review, audit, critique, or improve the UX/UI, accessibility, usability, visual polish, loading/empty/error states, tap targets, or platform fit of a mobile app — from source code, screenshots, or Figma designs.
---

<!-- Plugin copy of the root SKILL.md — keep the two in sync. Paths below are relative
     to the PLUGIN ROOT (two levels up from this file). -->

# Mobile UX Audit

Audit a mobile app's user experience and, when asked, fix the issues. This skill is a thin
wrapper: the full method lives in the portable playbook so it stays reusable outside Claude.

All referenced files live at the plugin root — from this skill file that is `../../`
(e.g. `../../playbook/ux-audit-playbook.md`). If a relative path misses, locate the file
by name with a glob.

## How to run

1. **Read the playbook first:** `playbook/ux-audit-playbook.md`. It defines the full process
   (detect stack → gather surface → run checklist → score → report → fix). Follow it in order.
   For apps larger than ~10 screens, follow **Section 6 (batch mode)** — audit in batches, keep
   findings in a `ux-audit-findings.md` ledger on disk, and keep peak context ≈ one batch. This
   is what keeps token cost flat as the app grows.
2. **Load references as needed** (progressive disclosure — don't read all upfront):
   - `references/stack-detection.md` — identify the framework + per-stack fix cheatsheet.
   - `references/heuristics.md` — Nielsen heuristics, mobile principles, a11y standards, anti-patterns.
   - `references/platform-guidelines.md` — iOS HIG vs Android Material conventions.
3. **Report** using `templates/audit-report-template.md`.

## Arguments / modes
- Default: **report only** — produce a prioritized audit, don't change code.
- `--fix`: after reporting, apply fixes for the findings (smallest blast radius first, UX-only,
  preserve behavior and existing code style, confirm each fix maps to a finding). Fixes land as
  **one reviewable unit per finding** (commit or delimited diff) — see playbook Step 6.
- `--tickets`: also emit each P0/P1 finding as a paste-ready GitHub/Jira issue block
  (playbook Step 7); P2/P3 grouped into one polish-backlog block.
- `--screens <names/paths>`: limit scope to specific screens/files.
- `--batch`: force batch mode even on a small app (see playbook Section 6). Auto-engaged for
  large apps regardless.
- `--trace`: run the structure map first (playbook Step 2.5) — statically read the stack's
  routing/nav config (and GraphQL schema if present) to order batches by real user flow and
  catch orphan/dead-end screens. Falls back to file inventory if tracing is ambiguous.
- Input can be **source code** (default), **screenshots** the user pastes, or **Figma** designs.

## Config
If the target repo contains `ux-audit.config.json`, honor it (playbook Step 0): enabled
categories, severity overrides, ignore globs, scope, batch size, and the `failOn` CI gate.
Schema/defaults: `ux-audit.config.example.json`.

## Guardrails
- Every finding must cite `file:line` or a screenshot region — no vague advice.
- Don't invent screens; audit only what exists.
- In fix mode: UX changes only, never logic/behavior; keep the codebase's conventions; never
  bulk-rewrite a screen. After each fix, restate the finding it resolves.
- If the stack is ambiguous, state your assumption or ask before proceeding.
