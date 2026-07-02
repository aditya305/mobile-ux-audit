# 📱 Mobile UX Audit

An **agent-agnostic UX audit toolkit** for mobile apps. Point it at a mobile codebase (or
screenshots / Figma designs) and it produces a **prioritized, evidence-backed UX audit** - and,
on request, **fixes the issues**.

Supports **React Native / Expo, Flutter, SwiftUI / UIKit, Jetpack Compose / XML,
Kotlin Multiplatform, .NET MAUI / Xamarin, Ionic / Capacitor / Cordova, and PWAs** -
with webview-specific checks for the last two.

> **Design principle:** the audit logic lives in one portable Markdown "brain"
> ([`playbook/ux-audit-playbook.md`](playbook/ux-audit-playbook.md)). Tool-specific wrappers
> (`SKILL.md`, `AGENTS.md`) are thin and just tell each tool *when* to load the brain. So this
> works with Claude today and any other agent tomorrow - with zero changes to the logic.

## What it checks
Touch targets & interaction, loading/empty/error states, accessibility (labels, contrast,
dynamic type), visual hierarchy & spacing, safe areas & responsiveness, forms & input,
navigation & flow, feedback & motion, content & copy, iOS HIG / Android Material platform fit.

Each finding gets a **severity (P0-P3)**, a **confidence tag** (verified / likely /
needs-runtime, with a how-to-verify hint), an **effort estimate**, an **evidence pointer
(`file:line`)**, and a **concrete fix**. See [`references/heuristics.md`](references/heuristics.md)
and a full [example report](examples/example-report.md).

## Built for real dev workflows
- **Batch mode** - large apps are audited in screen batches with findings flushed to a disk
  ledger, so token cost stays flat as the app grows (playbook section 6).
- **Structure trace** - optionally reads the stack's routing config (and GraphQL schema if
  present) to order batches by real user flow and catch orphan/dead-end screens (Step 2.5).
- **Re-audit diffing** - run it again next sprint; the report leads with
  `Delta since last audit: 4 fixed, 2 new, 1 regressed` (playbook section 6.5).
- **Reviewable fixes** - `--fix` lands one commit/diff per finding, never a merged blob.
- **Ticket export** - `--tickets` emits paste-ready GitHub/Jira issue blocks for every P0/P1.

## Repo layout
```
mobile-ux-audit/
├── SKILL.md                        # Claude Code skill wrapper (/audit-ux)
├── AGENTS.md                       # Wrapper for Cursor / Copilot / other agents
├── cli/                            # standalone CLI (audit + screenshot-diff), Claude API
├── ux-audit.config.example.json    # per-repo config: categories, failOn gate, ignore globs
├── playbook/
│   └── ux-audit-playbook.md        # <- the portable brain (the real logic)
├── references/
│   ├── stack-detection.md          # detect framework + fix cheatsheet + verify hints
│   ├── heuristics.md               # Nielsen + mobile principles + a11y + anti-patterns
│   └── platform-guidelines.md      # iOS HIG vs Android Material
├── templates/
│   └── audit-report-template.md    # the report format (findings, fixes, tickets)
└── examples/
    └── example-report.md           # what the output looks like
```

## Use it with Claude Code

**Install as a plugin (recommended)** - inside Claude Code:
```
/plugin marketplace add aditya305/mobile-ux-audit
/plugin install mobile-ux-audit@aditya305
```
Then invoke with `/mobile-ux-audit:audit-ux` in any mobile project.

**Or install manually as a personal skill:**
```bash
git clone https://github.com/aditya305/mobile-ux-audit ~/.claude/skills/audit-ux
```
(per-project: clone into `.claude/skills/audit-ux` instead)

Then in Claude Code:
```
/audit-ux                       # report only
/audit-ux --fix                 # audit, then apply fixes (one commit/diff per finding)
/audit-ux --batch               # force batch mode (auto for ~10+ screens)
/audit-ux --trace               # trace nav/GraphQL structure first, order by user flow
/audit-ux --tickets             # also emit GitHub/Jira issue blocks for P0/P1
/audit-ux --screens login home  # limit scope
```
Run it again next sprint against the same ledger and the report opens with what got
fixed, what's new, and what regressed.

## Use it as a standalone CLI (CI-ready)

No agent needed - the CLI calls the Claude API directly with the same playbook, using
prompt caching so the playbook is billed once and read from cache on every batch.

```bash
# no install needed:
export ANTHROPIC_API_KEY=...     # or `ant auth login`

npx mobile-ux-audit ./my-app                # audit -> ledger + report + exit code
npx mobile-ux-audit ./my-app --dry-run      # inventory + batch plan, no API calls
npx mobile-ux-audit ./my-app --fail-on P1   # CI gate: exit 1 on P0/P1 findings
npx mobile-ux-audit diff --baseline shots/v1 --current shots/v2 --analyze
                                            # screenshot-diff regression mode
```

- **Batched with prompt caching** - flat peak cost regardless of app size.
- **Re-audit diffing** - reruns lead with `Delta: fixed / new / still open`.
- **`ux-audit.config.json`** - tune model, categories, severity overrides, ignore globs,
  batch size, and the `failOn` gate (see `ux-audit.config.example.json`).
- **Screenshot-diff mode** - pixelmatch baseline vs current; `--analyze` sends changed
  pairs to Claude vision for a regression verdict; `--fail-on-regression` gates CI.

## Use it with any other agent
- **Cursor / Copilot / Windsurf:** drop this repo in your project (or copy `AGENTS.md` +
  `playbook/` + `references/`). The agent reads `AGENTS.md` and follows the playbook.
- **Any LLM / manual:** attach or paste
  [`playbook/ux-audit-playbook.md`](playbook/ux-audit-playbook.md) and say
  "audit the UX of this app following this playbook." That's it - the playbook is self-contained.

## Roadmap
- [x] Batch mode with disk ledger (flat token cost on large apps).
- [x] Structure/GraphQL trace to order audits by real user flow.
- [x] Re-audit diffing (fixed / new / regressed).
- [x] Ticket export + reviewable per-finding fixes.
- [x] Extended stacks: KMP, MAUI/Xamarin, Ionic/Capacitor/Cordova, PWA.
- [x] Standalone CLI (`mobile-ux-audit`) calling the Claude API, with prompt caching + CI exit codes.
- [x] Screenshot-diff regression mode (pixelmatch + optional Claude vision verdicts).
- [x] Config file (`ux-audit.config.json`) for severity overrides and enabled categories.
- [x] Published to npm: [`mobile-ux-audit`](https://www.npmjs.com/package/mobile-ux-audit) (`npx mobile-ux-audit`).
- [ ] GitHub Action wrapper.

## License
MIT - see [LICENSE](LICENSE).
