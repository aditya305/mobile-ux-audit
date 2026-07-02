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

### Step 0 — Load config (if present)
If the repo has a `ux-audit.config.json` (schema: `ux-audit.config.example.json` in this
toolkit), honor it: disabled `categories` are skipped (state what you skipped),
`severityOverrides` re-rank findings, `ignore` globs extend the default skip list, `screens`
limits scope, `batchSize` tunes batch mode, and `failOn` defines the CI pass/fail gate.
No config file → all defaults apply.

### Step 1 — Detect the stack
Identify the framework so you read the right files and apply the right guidelines.
See `references/stack-detection.md` for exact signals. Summary:

| Signal | Stack |
|---|---|
| `package.json` with `react-native` / `expo` | React Native / Expo |
| `pubspec.yaml`, `lib/**/*.dart` | Flutter |
| `*.xcodeproj`, `*.swift`, `ContentView.swift` | Native iOS (SwiftUI/UIKit) |
| `build.gradle`, `*.kt`, `@Composable` / `res/layout/*.xml` | Native Android (Compose/XML) |
| `kotlin("multiplatform")`, `commonMain/`, `composeApp/` | Kotlin/Compose Multiplatform |
| `*.csproj` with `<UseMaui>`, `*.xaml` | .NET MAUI / Xamarin |
| `capacitor.config.*`, `ionic.config.json`, `config.xml` | Ionic / Capacitor / Cordova (webview) |
| `manifest.webmanifest` + service worker, no native shell | PWA / mobile web |

If multiple or none match, ask the user or state your assumption explicitly before proceeding.
The Section 2 checklist is framework-agnostic — for webview stacks additionally run the
**webview-specific checks** in `references/stack-detection.md`.

### Step 2 — Gather the surface to audit
Collect what you'll actually evaluate:
- **Source mode:** locate UI files (screens, components, styles, navigation). Skip generated
  files, tests, and `node_modules`/`build`/`Pods`/`.dart_tool`.
- **Screenshot mode:** the user provides images; map each to a screen name.
- **Design mode (Figma):** pull frames via the design tool.
- Prefer auditing **user-facing screens first** (onboarding, auth, home, checkout, forms).

**Do not read file contents yet.** Only build an *inventory* of paths (use glob/`find`, not
reads). If the app is larger than a handful of screens, switch to **batch mode** — see Section 6.

### Step 2.5 — Trace the app structure (optional, static, cheap)
Before auditing, build a compact **structure map** so batches are ordered by real user impact and
navigation/state findings become detectable. This is a *map to guide the audit* — never a
dependency the audit can't run without. Rules:
- **Static only.** Read the routing/nav config file(s) below — do **not** run the app or crawl
  every import.
- **Summarize into the ledger, then forget the source.** Extract `screen → routes-to` (and, if a
  data graph exists, `screen → query/model`). Keep the map small; drop the raw config.
- **Graceful fallback.** If tracing fails or the config is ambiguous, fall back to the plain file
  inventory from Step 2 and **say so**. Never block the audit on this step.

**Where the structure lives, per stack** (read only these, not the whole tree):

| Stack | Navigation / route source to read |
|---|---|
| React Native / Expo | Expo Router `app/` file tree; or React Navigation `createNativeStackNavigator`/`Stack.Screen`/`Tab.Screen`, `NavigationContainer`, a central `routes`/`linking` config. |
| Flutter | `MaterialApp.routes` / `onGenerateRoute`, `GoRouter`/`AutoRoute` route tables, `Navigator.pushNamed` call sites. |
| Native iOS (SwiftUI/UIKit) | SwiftUI `NavigationStack`/`NavigationLink`/`.sheet`/`TabView`; UIKit storyboards (`*.storyboard` segues) and `UINavigationController` push/present sites. |
| Native Android (Compose/XML) | Jetpack `NavHost`/`composable(route=…)`/Navigation graph `res/navigation/*.xml`; Activity/Fragment `Intent`/`FragmentTransaction` sites. |
| Kotlin/Compose Multiplatform | Same as Compose (`NavHost` in `commonMain`), or Decompose/Voyager navigator configs. |
| .NET MAUI / Xamarin | `AppShell.xaml` routes, `Routing.RegisterRoute`, `Shell.Current.GoToAsync` / `Navigation.PushAsync` sites. |
| Ionic / Capacitor / PWA | The web router: Angular `Routes[]`, React Router / `IonRouterOutlet` routes, Vue Router config. |

**Optional data-graph trace (only if the app uses one — all stacks):**
- **GraphQL** — read `schema.graphql`, `*.graphql`/`*.gql` operation files, or codegen output
  (Apollo/urql/`graphql_codegen`/`gql` for Flutter). Map each screen to the query/mutation it
  fires. This directly drives **state-coverage checks (§2.2)**: a screen with a query *must* have
  loading/empty/error branches.
- **REST/other** — no schema to pull; infer `screen → data call` from fetch/`useQuery`/repository
  call sites instead. Same purpose, lower fidelity.

Use the map to (a) order batches entry-screens-first, (b) flag **orphan screens** (defined but
never navigated to) and **dead-ends** (no back/exit) as navigation findings in §2.7.

### Step 3 — Run the checklist
Evaluate against **Section 2** below. For each screen/component, walk every category. Record
a finding only when you can point to evidence.

### Step 4 — Score and prioritize
Assign each finding a **severity** (Section 3) and an **effort** estimate (S/M/L). Sort by
severity, then by effort (quick high-impact wins first).

### Step 5 — Report
Emit the report using `templates/audit-report-template.md`. Lead with a short summary
(counts by severity + top 3 things to fix now). If a previous audit ledger exists, lead with
the **Δ since last audit** line instead — see §6.5 (re-audit diffing).

### Step 6 — Fix (only if requested)
Apply fixes smallest-blast-radius first. After each fix, restate the finding it resolves.
Do not change behavior/logic — only UX. Keep the codebase's existing style and conventions.
Re-run the relevant checklist item to confirm the fix. Never bulk-rewrite screens.

**Output shape — reviewable units.** Fixes must land as units the developer can accept or
reject *individually*:
- **One finding = one unit.** If committing, one commit per finding with message
  `fix(ux): <finding id> — <short title>`. If not committing, present one clearly-delimited
  diff per finding — never one merged blob for the whole audit.
- **Before/after evidence.** For each unit show the exact lines changed (before → after) and
  restate the checklist item (§2.x) it now satisfies.
- **Stop on doubt.** If a fix would touch logic, state flow, or more than ~2 files, don't apply
  it — downgrade to a recommendation and say why.

### Step 7 — Ticket export (only if requested)
On request (`--tickets`), emit each **P0 and P1** finding as a paste-ready issue block
(GitHub/Jira-compatible — see the "Ticket export" section of the template). One block per
finding; P2/P3 go into a single "polish backlog" block unless the user asks for all.

### Step 8 — Screenshot-diff regression (only if requested)
Given a **baseline** and **current** set of same-named screenshots, compare pixel-for-pixel,
then judge each *changed* screen: is the change a regression (broken layout, clipped text,
content under system bars, lost affordances, contrast loss) or an intentional
improvement/neutral redesign? Report per-screen verdicts with severity. The CLI automates
this (`mobile-ux-audit diff --baseline <dir> --current <dir> [--analyze]`); when running as
an agent, do the comparison visually on the provided image pairs using the same criteria.

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
| **P0 – Blocker** | User cannot complete a core task, or the app is inaccessible to a group. | Crash on error, invisible text, control with no way to proceed, keyboard covers submit, critical control hidden under the notch/home indicator, screen with no back/exit (dead end). |
| **P1 – Major** | Task completable but painful; real risk of abandonment. | No error/empty state, tap targets too small, no press feedback, missing a11y labels on key actions, Android hardware back broken/ignored. |
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
7. **Tag your confidence.** Every finding carries one of:
   - `[verified]` — you read the code and are certain (e.g. an icon button with no label prop).
   - `[likely]` — a pattern match that usually indicates the problem; the dev should confirm
     (e.g. `TouchableWithoutFeedback` present, pressed state *might* live elsewhere).
   - `[needs-runtime]` — cannot be known statically: exact contrast ratios, animation jank,
     scroll performance, real-device rendering. State how to verify (see the per-stack
     verification hints in `references/stack-detection.md`).
   Never present a `[likely]`/`[needs-runtime]` finding as certain. P0s should be `[verified]`
   whenever possible — a blocker claim demands the strongest evidence.

---

## 5. Output contract

Produce a report matching `templates/audit-report-template.md`:
- Summary: counts by severity + top 3 immediate fixes (+ the Δ line on a re-audit, §6.5).
- Findings table/list, sorted P0→P3, each with: id, severity, **confidence**
  (verified/likely/needs-runtime, rule §4.7), screen, category, evidence (`file:line`), issue,
  recommended fix, effort (S/M/L).
- If fixing: a "Fixes applied" section mapping each fix back to its finding id — one
  reviewable unit per finding (Step 6).
- If tickets requested: a "Ticket export" section with paste-ready P0/P1 issue blocks (Step 7).

---

## 6. Batch mode (large apps — the token-saving path)

The default single-pass flow works for small apps (≲ 10 screens). Above that, holding the whole
codebase in context is expensive and degrades quality. Batch mode keeps **peak context small and
roughly constant regardless of app size**: you only ever hold one batch of files at a time, and
finished findings live on disk, not in the conversation.

### 6.1 When to switch
Use batch mode when the inventory (Step 2) exceeds ~10 screens, ~40 UI files, or when the user
asks to audit "the whole app." Otherwise the single pass is fine.

### 6.2 The protocol

1. **Inventory (cheap).** Glob UI file *paths* only — do **not** read contents. Group them into
   **batches by screen/route**, ~5–8 screens per batch. Order batches by user impact — use the
   **Step 2.5 structure map** if you built one (entry screens → deep flows), else
   onboarding/auth/home/checkout first. List the batches to the user before starting.

2. **Set up the ledger.** Create one scratch file, `ux-audit-findings.md` (in the scratchpad or a
   path the user picks — a repo path like `docs/ux-audit-findings.md` is best for re-audits).
   This is the source of truth for findings — **not** the conversation. Write a header (app,
   stack, date, batch plan with checkboxes). **If a previous ledger already exists, don't
   overwrite it** — keep it for the re-audit diff (§6.5) and write the new one alongside
   (e.g. date-suffixed).

3. **Per batch — read → check → flush → forget:**
   - Read only *this batch's* files.
   - Walk the Section 2 checklist against them.
   - **Append** this batch's findings to `ux-audit-findings.md` (full finding rows: id, sev,
     screen, category, `file:line`, issue, fix, effort). Tick the batch's checkbox.
   - Emit a one-line progress note to the user (`Batch 3/9 done — 2×P1, 4×P2`).
   - **Do not carry the batch's file contents into the next batch.** Move on with a fresh slate;
     the ledger holds what matters.

4. **Dedup as you go — patterns, not repetition.** Before appending, check the ledger for the
   same issue. A problem that recurs across many screens (e.g. no `accessibilityLabel` on icon
   buttons) is **one finding** with an "affected files" list — not N copies. This is where most
   of the token *and* signal savings come from.

5. **Assemble the final report** only at the end, from the ledger, using the template. The
   conversation never has to hold all findings at once.

### 6.3 Resumability
The ledger's batch checkboxes are the resume point. If the audit is interrupted, re-read
`ux-audit-findings.md`, find the first unticked batch, and continue from there — no re-work.

### 6.4 Token discipline (applies in any mode)
- Inventory with globs/`grep`, not full reads. Read a file only when you're about to audit it.
- In **lean** situations, `grep` for signal patterns first (`accessibilityLabel`, `isLoading`,
  `SafeArea`, `TouchableWithoutFeedback`, hardcoded hex colors, fixed `height`/`width`), then
  read only the files that hit. State that you did this so misses are auditable.
- Never read `node_modules`, `build`, `Pods`, `.dart_tool`, generated, or test files.
- Findings go to the ledger, not the chat. Keep peak context ≈ one batch.

### 6.5 Re-audit diffing (applies in any mode)
If a previous `ux-audit-findings.md` exists (from a prior run of this audit), **diff against it
before reporting**. Match findings by evidence location (file + category), not by id — ids can
shift. Classify each old finding as:
- **Fixed** — the issue no longer exists at (or near) the cited location.
- **Still open** — carry it forward, keep its history.
- **Regressed** — was marked fixed in a prior run, has reappeared. Escalate one severity level
  in the summary callout (a regression is worse than a first offense).
And each new finding as **new since last audit**.

Lead the report with the delta line:
`Δ since last audit (<date>): 4 fixed · 2 new · 1 regressed · 6 still open` — then the normal
summary. This turns the audit from a one-shot critique into a quality gate a team can run
every sprint.
