# 📱 Mobile UX Audit

An **agent-agnostic UX audit toolkit** for mobile apps. Point it at a mobile codebase (or
screenshots / Figma designs) and it produces a **prioritized, evidence-backed UX audit** — and,
on request, **fixes the issues**.

Supports **React Native / Expo, Flutter, SwiftUI / UIKit, and Jetpack Compose / XML**.

> **Design principle:** the audit logic lives in one portable Markdown "brain"
> ([`playbook/ux-audit-playbook.md`](playbook/ux-audit-playbook.md)). Tool-specific wrappers
> (`SKILL.md`, `AGENTS.md`) are thin and just tell each tool *when* to load the brain. So this
> works with Claude today and any other agent tomorrow — with zero changes to the logic.

## What it checks
Touch targets & interaction · loading/empty/error states · accessibility (labels, contrast,
dynamic type) · visual hierarchy & spacing · safe areas & responsiveness · forms & input ·
navigation & flow · feedback & motion · content & copy · iOS HIG / Android Material platform fit.

Each finding gets a **severity (P0–P3)**, an **effort estimate**, an **evidence pointer
(`file:line`)**, and a **concrete fix**. See [`references/heuristics.md`](references/heuristics.md).

## Repo layout
```
mobile-ux-audit/
├── SKILL.md                        # Claude Code skill wrapper (/audit-ux)
├── AGENTS.md                       # Wrapper for Cursor / Copilot / other agents
├── playbook/
│   └── ux-audit-playbook.md        # ← the portable brain (the real logic)
├── references/
│   ├── stack-detection.md          # detect framework + per-stack fix cheatsheet
│   ├── heuristics.md               # Nielsen + mobile principles + a11y + anti-patterns
│   └── platform-guidelines.md      # iOS HIG vs Android Material
└── templates/
    └── audit-report-template.md    # the report format
```

## Use it with Claude Code (published skill)

Install as a skill, then run `/audit-ux` in any mobile project.

**Global (all your projects):**
```bash
git clone https://github.com/<you>/mobile-ux-audit ~/.claude/skills/audit-ux
```
**Or per-project:**
```bash
git clone https://github.com/<you>/mobile-ux-audit .claude/skills/audit-ux
```
Then in Claude Code:
```
/audit-ux              # report only
/audit-ux --fix        # audit, then apply fixes
```

## Use it with any other agent
- **Cursor / Copilot / Windsurf:** drop this repo in your project (or copy `AGENTS.md` +
  `playbook/` + `references/`). The agent reads `AGENTS.md` and follows the playbook.
- **Any LLM / manual:** attach or paste
  [`playbook/ux-audit-playbook.md`](playbook/ux-audit-playbook.md) and say
  "audit the UX of this app following this playbook." That's it — the playbook is self-contained.

## Roadmap
- [ ] Standalone CLI (`npx mobile-ux-audit`) that calls an LLM API for CI use.
- [ ] Screenshot-diff regression mode.
- [ ] Config file to tune severity thresholds and enabled categories.

## License
MIT — see [LICENSE](LICENSE).
