---
name: audit-ux
description: Audit the UX of a mobile app (React Native/Expo, Flutter, SwiftUI/UIKit, Jetpack Compose/XML) and optionally fix the issues. Use when the user wants to review, audit, critique, or improve the UX/UI, accessibility, usability, visual polish, loading/empty/error states, tap targets, or platform fit of a mobile app — from source code, screenshots, or Figma designs.
---

# Mobile UX Audit

Audit a mobile app's user experience and, when asked, fix the issues. This skill is a thin
wrapper: the full method lives in the portable playbook so it stays reusable outside Claude.

## How to run

1. **Read the playbook first:** `playbook/ux-audit-playbook.md`. It defines the full process
   (detect stack → gather surface → run checklist → score → report → fix). Follow it in order.
2. **Load references as needed** (progressive disclosure — don't read all upfront):
   - `references/stack-detection.md` — identify the framework + per-stack fix cheatsheet.
   - `references/heuristics.md` — Nielsen heuristics, mobile principles, a11y standards, anti-patterns.
   - `references/platform-guidelines.md` — iOS HIG vs Android Material conventions.
3. **Report** using `templates/audit-report-template.md`.

## Arguments / modes
- Default: **report only** — produce a prioritized audit, don't change code.
- `--fix`: after reporting, apply fixes for the findings (smallest blast radius first, UX-only,
  preserve behavior and existing code style, confirm each fix maps to a finding).
- `--screens <names/paths>`: limit scope to specific screens/files.
- Input can be **source code** (default), **screenshots** the user pastes, or **Figma** designs.

## Guardrails
- Every finding must cite `file:line` or a screenshot region — no vague advice.
- Don't invent screens; audit only what exists.
- In fix mode: UX changes only, never logic/behavior; keep the codebase's conventions; never
  bulk-rewrite a screen. After each fix, restate the finding it resolves.
- If the stack is ambiguous, state your assumption or ask before proceeding.
