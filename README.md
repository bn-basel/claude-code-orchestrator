# Claude Code Orchestrator

**One Claude Code session runs the whole feature for you.** It plans with you in plain language, hands each small
task to a specialised helper, proves every change by running commands, and opens one pull request. You approve the
plan and click merge.

[Install prompt](INSTALL-PROMPT.md) · [Upgrade prompt](UPGRADE-PROMPT.md) · [Changelog](CHANGELOG.md) · [Project page](https://bn-basel.github.io/claude-code-orchestrator/)

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
  <img alt="Flowchart from your prompt to live. Your prompt, then Plan, then a yes/no check: you approve? No goes back to Plan. Then Build, Check by command, and: all checks pass? No goes back to Build. Code review, then: review clean? A code problem goes back to Build, a design problem back to Plan. Open the pull request, then: CI green? No goes back to Build. You merge, the orchestrator verifies, then: works live? No switches it off and goes back to Plan. Finally Learn, and the next feature starts at a new prompt." src="docs/assets/loop-light.png" width="100%">
</picture>

Every task gets a label from one question: *if this goes wrong, how hard is it to undo?* **Small** work takes the
light path. **Wide** and **closed** work also gets a review of the plan and tests written before the code. Every way
back has a budget: two fixes per task, two code-review rounds and three plan-review rounds; after that, you decide.
Every review finding has to come with evidence, such as a command and its output, or it doesn't send work back.

## The team

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/team-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/team-light.png">
  <img alt="You decide four things: approve the plan, say yes to Fable, run migrations, click merge. The orchestrator (Opus) plans, briefs, checks and opens PRs, and never writes product code. It briefs seven helpers in three groups: Build (implementer, implementer-wide, test-writer), Review (reviewer, reviewer-light, adversarial-reviewer, which needs your yes) and Look up (scout)." src="docs/assets/team-light.png" width="100%">
</picture>

Each helper is one file in `.claude/agents/` with a fixed model and tool list. No helper can start another.

For work that changes a screen, an eighth helper, **`ui-tester`** (Haiku 5.5), clicks through the change on your local
dev server and screenshots it at phone and desktop width. It can't edit code or run commands, only opens `localhost`,
and uses test accounts only. Its screenshots are evidence for the PR; the proof is still the scripted end-to-end tests
that run in CI.

## Quick start

Open Claude Code in the folder that contains your project (or an empty folder, for a new project) and type:

```
Install the Claude Code Orchestrator v1.2 here: clone https://github.com/bn-basel/claude-code-orchestrator at tag v1.2 next to this folder, then follow its INSTALL-PROMPT.md.
```

It clones this repo at a fixed version, then backs up, audits your project, adapts the rules, installs one approved step
at a time, and ends with a small trial feature. No project yet? It creates the GitHub repo, a minimal skeleton with one
test and a CI check, and then installs as usual. (To do it by hand: clone the repo and paste
[`INSTALL-PROMPT.md`](INSTALL-PROMPT.md).) After that, start every session with:

```
You're the orchestrator. Read ORCHESTRATOR.md, then the Now section of PLAN.md, and report.
```

You need Claude Code 2.1.293 or later, a GitHub account with the `gh` command-line tool, and access to Opus, Sonnet
and Haiku. Branch protection on a **private** repo needs GitHub Pro or a paid team plan; on a free account it works on
public repos.

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
- **Optional:** for a wide feature whose big tasks share no files, `ORCHESTRATOR.md` §13 describes running them in
  parallel, each in its own worktree. It saves waiting time, not tokens, so it's off by default.

No Fable access? Set `model: opus` in `adversarial-reviewer.md`. Not on Windows? Remove the `PowerShell(...)` rules and point the hook at `print-now.sh` (the install does both).

## Upgrades

The install records its version in `.claude/orchestrator-version`. To move to a newer version, open Claude Code in your
workspace and type:

```
Upgrade the Claude Code Orchestrator here to v1.2: clone https://github.com/bn-basel/claude-code-orchestrator next to this folder, or update the clone that is already there, then follow its UPGRADE-PROMPT.md.
```

It compares the two template versions and applies only the changes, one by one with your yes, onto your adapted files.
Your own rules stay.

## Long sessions

The orchestrator runs long sessions, so the template guards its context:

- **Rotate first.** After a merge, past about 250k tokens, start a fresh session. The Now block in `PLAN.md`
  carries the state over: the goal, the stage, the next step, and your decisions, written down as you make them.
- **Auto-compact at 400k as a backup.** On 1M-context models Claude Code would otherwise wait until about 967k, and
  every message re-sends the whole conversation. The template sets `"autoCompactWindow": 400000`; `/autocompact 400k`
  does the same for one model.
- **Same shape every session.** An output style (`.claude/output-styles/orchestrator.md`) fixes how the orchestrator
  replies: session start, decision request, plan approval, progress, done report. It's part of every request, so a new
  session or a compacted one answers the same way.
- **Nothing lost on compaction.** A hook prints the Now block into the conversation when a session starts and
  right after a compaction.
- **Fresh helpers beat cold ones.** A helper costs about 11–12k tokens to start. Its cache lasts 5 minutes, so the
  orchestrator resumes one only within that window; otherwise it starts a fresh helper with a short brief. Helpers
  commit before reporting and end with a HANDOFF line (tried, didn't work, would do next), so the fresh helper gets the
  work and the reasoning.

## Orchestrator or Projects?

Claude Code **Projects** (public beta on Pro and Max) is the built-in version of the same idea: one coordinator
conversation, one thread per task, shared instructions and memory, and threads that run in the cloud by default.

- **Use Projects** for a self-contained GitHub repo, when you're happy for the work to run in the cloud.
- **Use this orchestrator** for local work and a different model per helper. Projects can't adopt a local session,
  gives every thread the same model (all Opus by default, which uses plan limits faster), and is still a beta.

## License

[MIT](LICENSE)
