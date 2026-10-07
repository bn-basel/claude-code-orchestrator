# Claude Code Orchestrator

**One Claude Code session runs the whole feature for you.** It plans with you in plain language, hands each small
task to a specialised helper, proves every change by running commands, and opens one pull request. You approve the
plan and click merge.

[Install prompt](INSTALL-PROMPT.md) · [Changelog](CHANGELOG.md) · [Project page](https://bn-basel.github.io/claude-code-orchestrator/)

## Why I built this

I built this for my own use, while developing my own product. I was working across a lot of Claude chats, and I
was the one carrying plans, reports and context between them by hand. That was slow, and it kept causing
problems: every hand-off was a chance for something to get lost or misread.

So I gave the job of the go-between to a single **orchestrator** session. It talks to me, delegates to helpers,
checks their work itself, and only comes back to me for the decisions that are really mine.

This is **version 1**. It's my personal setup, published in case it helps someone else, and it will keep changing
as my own workflow improves.

## How it works

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/loop-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/loop-light.png">
  <img alt="The loop in three phases. Decide: your idea, the orchestrator's plan, a plan review for wide and closed work, and your approval. Build and prove: tests first for wide and closed work, build, check by command, code review. Ship and learn: open the PR, you merge, verify, learn. Failed checks, code blockers and CI failures go back to Build; design blockers and failed live checks go back to Plan." src="docs/assets/loop-light.png" width="100%">
</picture>

Every task gets a label from one question: *if this goes wrong, how hard is it to undo?* **Small** work skips the
two dashed steps. **Wide** and **closed** work gets a plan review and tests written first. Failures go back with a
budget of two fixes per task and two review rounds; after that, you decide.

## The team

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/team-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/team-light.png">
  <img alt="You decide four things: approve the plan, say yes to Fable, run migrations, click merge. The orchestrator (Opus) plans, briefs, checks and opens PRs, and never writes product code. It briefs seven helpers in three groups: Build (implementer, implementer-wide, test-writer), Review (reviewer, reviewer-light, adversarial-reviewer, which needs your yes) and Look up (scout)." src="docs/assets/team-light.png" width="100%">
</picture>

Each helper is one file in `.claude/agents/` with a fixed model and tool list. No helper can start another.

## Quick start

1. Clone this repo next to your project.
2. Open Claude Code in the folder that contains your project.
3. Paste [`INSTALL-PROMPT.md`](INSTALL-PROMPT.md), with the path to `template/` filled in.

It backs up, audits your project, adapts the rules, installs one approved step at a time, and ends with a small
trial feature. After that, start every session with:

```
You're the orchestrator. Read ORCHESTRATOR.md, then the Now section of PLAN.md, and report.
```

You need Claude Code, your code on GitHub, the `gh` command-line tool, and access to Opus and Sonnet.

## Make it yours

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/workspace-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/workspace-light.png">
  <img alt="Your workspace holds CLAUDE.md, ORCHESTRATOR.md, PLAN.md, .claude/, backlog/ and ops/ (you only), plus two checkouts of your code: app/ on main, which agents only read, and _worktrees/build on a feature branch, where helpers write code. The build branch is pushed to GitHub, goes through a pull request and CI checks, you merge into protected main, and app/ pulls the result." src="docs/assets/workspace-light.png" width="100%">
</picture>

The install prompt walks you through these:

- **Fill in** the placeholders like `{{PROJECT_NAME}}`, `{{MAIN_BRANCH}}` and your test commands.
- **Decide** the spots marked `<!-- ADAPT -->`: what counts as small, wide or closed in your code, and your product rules.
- **Review** the deny list in `.claude/settings.json`, and add your own production scripts to it.
- **Keep** the core: the loop, the labels, checking by command, and one PR per feature.

No Fable access? Set `model: opus` in `adversarial-reviewer.md`. Not on Windows? Remove the `PowerShell(...)` rules.

## License

[MIT](LICENSE)
