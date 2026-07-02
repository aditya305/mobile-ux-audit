# Mobile UX Audit Playbook

> A portable, agent-agnostic process for auditing the UX of a mobile app and fixing
> the issues. This file is the "brain." It has **no dependency on any specific AI tool** —
> it can be run by Claude, Cursor, Copilot, a custom script, or a human reviewer.
>
> Wrappers (`SKILL.md`, `AGENTS.md`, a CLI) only tell a given tool *when* to load this
> file. The actual method lives here.

---

## 0. What this does

Given a mobile codebase (and optionally screenshots or designs), produce a **prioritized,
evidence-backed UX audit** and, when asked, **apply fixes**. Every finding must cite a
concrete location (`file:line`) or a screenshot region — never vague advice.

Non-goals: architecture review, business logic bugs, backend performance. Stay on **user
experience**: usability, accessibility, visual clarity, responsiveness, and platform fit.

---

## 1. Process (run in order)

### Step 1 — Detect the stack
Identify the framework so you read the right files and apply the right guidelines.
See `references/stack-detection.md` for exact signals. Summary:

| Signal | Stack |
|---|---|
| `package.json` with `react-native` / `expo` | React Native / Expo |
| `pubspec.yaml`, `lib/**/*.dart` | Flutter |
| `*.xcodeproj`, `*.swift`, `ContentView.swift` | Native iOS (SwiftUI/UIKit) |
| `build.gradle`, `*.kt`, `@Composable` / `res/layout/*.xml` | Native Android (Compose/XML) |

If multiple or none match, ask the user or state your assumption explicitly before proceeding.

### Step 2 — Gather the surface to audit
Collect what you'll actually evaluate:
- **Source mode:** locate UI files (screens, components, styles, navigation). Skip generated
  files, tests, and `node_modules`/`build`/`Pods`/`.dart_tool`.
- **Screenshot mode:** the user provides images; map each to a screen name.
- **Design mode (Figma):** pull frames via the design tool.
- Prefer auditing **user-facing screens first** (onboarding, auth, home, checkout, forms).

### Step 3 — Run the checklist
Evaluate against **Section 2** below. For each screen/component, walk every category. Record
a finding only when you can point to evidence.

### Step 4 — Score and prioritize
Assign each finding a **severity** (Section 3) and an **effort** estimate (S/M/L). Sort by
severity, then by effort (quick high-impact wins first).

### Step 5 — Report
Emit the report using `templates/audit-report-template.md`. Lead with a short summary
(counts by severity + top 3 things to fix now).

### Step 6 — Fix (only if requested)
Apply fixes smallest-blast-radius first. After each fix, restate the finding it resolves.
Do not change behavior/logic — only UX. Keep the codebase's existing style and conventions.
Re-run the relevant checklist item to confirm the fix. Never bulk-rewrite screens.

---

## 2. The UX checklist

Each item: **what to check → how to detect it → typical fix.** Skip items that don't apply
to the current stack, but state what you skipped.

### 2.1 Touch targets & interaction
- **Tap target size** — interactive elements should be ≥ 44×44pt (iOS HIG) / 48×48dp
  (Material). *Detect:* buttons/icons with small fixed width/height, icon-only buttons with no
  padding, list rows under min height. *Fix:* add padding / `hitSlop` (RN) / min constraints.
- **Spacing between targets** — adjacent tappables need gap (≥ 8dp) to prevent mis-taps.
- **Feedback on press** — every tappable gives visual feedback (ripple/opacity/state). *Detect:*
  raw `View`/`div`-style handlers, `TouchableWithoutFeedback`, no pressed state. *Fix:* use the
  platform's pressable with a pressed style.
- **Disabled state clarity** — disabled controls look disabled and don't silently no-op.
- **Destructive actions** — delete/logout/pay confirm before firing, or are undoable.

### 2.2 State coverage (the #1 real-world gap)
Every data-driven screen must handle all four states:
- **Loading** — skeleton or spinner, not a blank/frozen screen.
- **Empty** — a helpful empty state with a next action, not a bare list.
- **Error** — a human message + a retry, not a crash/silent failure/raw error string.
- **Success/populated** — the normal case.
*Detect:* fetch/async code that only renders the happy path; `isLoading` used but no empty/error
branch. *Fix:* add the missing branches.

### 2.3 Accessibility (a11y)
- **Labels** — icons/images/icon-buttons have accessible labels
  (`accessibilityLabel` RN, `Semantics`/`contentDescription` Flutter/Android, `.accessibilityLabel`
  SwiftUI, `contentDescription` XML, `alt` for web views). *Detect:* icon-only controls with no label.
- **Roles/traits** — tappables expose button role; headings marked as headers.
- **Dynamic type / font scaling** — text respects OS font-size settings; layouts don't clip when
  fonts scale up. *Detect:* fixed heights around text, `allowFontScaling={false}`.
- **Contrast** — text/background contrast ≥ 4.5:1 (normal) / 3:1 (large). *Detect:* light-gray-on-
  white, brand color on similar bg. *Fix:* darken text / adjust bg.
- **Touch + screen reader order** — logical focus order; no traps.
- **Color not sole signal** — status not conveyed by color alone (add icon/text).

### 2.4 Visual hierarchy & layout
- **Consistent spacing scale** — margins/paddings follow a scale (4/8/12/16…), not random values.
- **Alignment** — elements align to a grid; no off-by-a-few-px drift.
- **Typographic hierarchy** — clear size/weight steps for title vs body vs caption; not everything
  the same size.
- **Crowding** — adequate whitespace; content not edge-to-edge without padding.
- **Truncation** — long text truncates gracefully (ellipsis) rather than overflowing/wrapping ugly.
- **Consistency** — same component looks/behaves the same across screens (buttons, cards, inputs).

### 2.5 Responsiveness & safe areas
- **Safe areas / notches** — content respects safe-area insets; nothing under the notch/home
  indicator/status bar. *Detect:* absolute top/bottom positioning, no `SafeAreaView`/insets.
- **Small & large screens** — layout holds on small phones and large/tablet; no clipping.
- **Orientation** — if rotation is allowed, layout adapts (or is locked intentionally).
- **Keyboard handling** — keyboard doesn't cover the focused input; scroll/avoidance present.
  *Detect:* forms with no `KeyboardAvoidingView`/`resizeToAvoidBottomInset`/scroll.

### 2.6 Forms & input
- **Correct keyboard type** — email/number/phone use matching keyboards.
- **Input affordances** — labels (not placeholder-only), clear errors near the field, inline
  validation, show/hide password, autofill/content-type hints.
- **Submission feedback** — button shows progress; double-submit prevented.
- **Sensible defaults & autofocus** — reduce taps.

### 2.7 Navigation & flow
- **Back behavior** — hardware/gesture back works and is predictable; no dead ends.
- **Titles & orientation** — user always knows where they are.
- **Deep flows** — long flows show progress; can be exited/saved.
- **Tab/nav consistency** — active state is obvious.

### 2.8 Feedback & motion
- **Confirm outcomes** — actions produce visible confirmation (toast/change of state).
- **Perceived performance** — optimistic UI or skeletons for slow ops.
- **Motion** — animations are smooth, purposeful, and respect "reduce motion" settings; not
  gratuitous or blocking.

### 2.9 Content & copy
- **Clarity** — labels/buttons use plain, action-oriented language.
- **Error messages** — say what happened and what to do, not codes.
- **Localization readiness** — no hardcoded concatenated strings that break translation; layouts
  tolerate longer languages.
- **Empty/onboarding copy** — guides the first-time user.

### 2.10 Platform fit
- **iOS (HIG)** vs **Android (Material)** conventions: navigation patterns, control styles, system
  fonts, share/date pickers, back behavior. Don't ship an iOS clone on Android or vice-versa where
  it feels foreign. See `references/platform-guidelines.md`.

---

## 3. Severity model

| Severity | Definition | Examples |
|---|---|---|
| **P0 – Blocker** | User cannot complete a core task, or the app is inaccessible to a group. | Crash on error, invisible text, control with no way to proceed, keyboard covers submit. |
| **P1 – Major** | Task completable but painful; real risk of abandonment. | No error/empty state, tap targets too small, no press feedback, missing a11y labels on key actions. |
| **P2 – Minor** | Noticeable friction or polish gap; doesn't block. | Inconsistent spacing, weak hierarchy, minor contrast miss, placeholder-as-label. |
| **P3 – Nit** | Cosmetic / preference. | 2px misalignment, slightly off shade, nicer-to-have animation. |

Rank fixes by severity first, then quick wins (low effort, high severity) next.

---

## 4. Rules for good findings

1. **Evidence or it didn't happen.** Every finding cites `file:line` or a screenshot region.
2. **One issue per finding.** Don't bundle.
3. **Actionable fix.** State the concrete change, in this codebase's idiom.
4. **No false confidence.** If unsure whether it's a real problem (e.g., contrast without exact
   values), say so and how to verify.
5. **Respect intent.** If something looks unusual it may be deliberate — flag, don't assume.
6. **Don't invent screens.** Only audit what exists.

---

## 5. Output contract

Produce a report matching `templates/audit-report-template.md`:
- Summary: counts by severity + top 3 immediate fixes.
- Findings table/list, sorted P0→P3, each with: id, severity, screen, category, evidence
  (`file:line`), issue, recommended fix, effort (S/M/L).
- If fixing: a "Fixes applied" section mapping each fix back to its finding id.
