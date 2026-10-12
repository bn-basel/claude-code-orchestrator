# Install prompt

This prompt installs the orchestrator workflow into **your** project, one approved step at a time. Claude does the work;
you say "yes" at every step and do the few hands-on parts yourself (secrets, branch protection, merging).

**Before you paste it**

1. Clone this repo somewhere **outside** your project, e.g. next to it.
2. Your code must be in a GitHub repo. The strongest safety layer (branch protection) lives on GitHub.
3. Open Claude Code in the folder that **contains** your project folder (or in an empty folder that will become the
   workspace). Use Opus at high effort, in the **default (ask) permission mode**, so you see every change.
4. Replace `<PATH>` below with the path to this repo's `template/` folder, then paste everything below the line.

It takes about an hour, plus one feature for the trial. You can stop at any step: progress is saved in `_setup/PROGRESS.md`.

---

You are installing the **Claude Code Orchestrator** workflow into my project.
Template folder: `<PATH>` (if this still says `<PATH>`, ask me for it before doing anything).

**What it is:** one orchestrator session plans features with me in plain language, hands each small task to a
specialised helper (subagent), checks every change by running commands, and opens one pull request per feature.
I approve the plan and click merge. The template has:

- `CLAUDE.md`: shared rules every agent loads · `ORCHESTRATOR.md`: the orchestrator's playbook · `PLAN.md`: the living record
- `.claude/settings.json`: allow / ask / deny permission rules, the auto-compact window, and a hook ·
  `.claude/agents/`: the seven helpers · `.claude/hooks/`: the after-compaction hook (Windows and macOS/Linux versions)
- `code-repo/CLAUDE.md` and `code-repo/.github/pull_request_template.md`: go into the code repo
- `gitignore`: becomes the workspace's `.gitignore`

Read every file in the template folder first. Text like `{{PROJECT_NAME}}` is a placeholder for a value.
`<!-- ADAPT: ... -->` marks a spot that needs a judgement about this project, not just a value.

**For every step:**
1. Explain in plain words what you'll change and why. Define any technical term the first time you use it.
2. Show the exact changes (for long files: the parts that differ from the template).
3. Wait for my "yes".
4. Do it, verify it, and report in a few lines.
5. Record progress in `_setup/PROGRESS.md`, so a fresh session can continue if this one restarts.

**Rules for this session:**
- Never read or print `.env` files or secrets. You may list secret file **names**, never their contents.
- Never push to the main branch, merge, force-push or rewrite history.
- **Never delete anything.** Move files into `_setup/moved/` instead, and tell me.
- Start no helpers (subagents) unless a step says so.
- Run git as `git -C <folder> …`. Never `cd <folder> && git …` (Claude Code asks for approval every time) and never
  `cd` in one command with git in the next (the folder isn't kept, so git runs in the wrong repo).
- If something doesn't match what the template expects: **stop and ask**. Don't guess.

## Step 1. Backup

- In the code repo: report uncommitted changes (I decide what to do with them), then create a local tag
  `pre-orchestrator-<date>` on the current commit. Don't push it.
- Copy any existing Claude setup (`CLAUDE.md` files, `.claude/` folders, `.mcp.json`) into `_setup/backup/`.
- Ask me to confirm that my production database (if any) has working backups. I check; you don't connect.

## Step 2. Read-only audit

Change nothing except writing `_setup/AUDIT.md`. Find and report:

- **The project:** what it does (2–4 lines, for `{{PROJECT_SUMMARY}}`), languages, frameworks, how it's deployed,
  and whether merging to the main branch deploys.
- **Git and GitHub:** main branch name, the GitHub repo (`owner/name`), the CI checks that run on PRs, and which
  `gh` accounts are logged in (`gh auth status`).
- **Commands:** how to run one test file, the full suite, and the type check or lint. Look in `package.json`,
  `pyproject.toml`, `Makefile`, the CI workflow files, and the README. Mark anything you couldn't confirm.
- **Existing Claude setup:** current `CLAUDE.md` rules worth keeping, and any broad allow rules (`Bash(*)`,
  `PowerShell(*)`, `Bash(git push *)`, bypass mode) in the project's `.claude/settings*.json` and in my global
  `~/.claude/settings.json`. Report them; don't change them yet.
- **Secrets:** which env files exist (names only) and whether real production keys appear to be on this machine
  (judge from file and variable **names**, never values).
- **Production touchpoints:** deploy CLIs, migration tools, scripts that reach production, admin scripts.
- **Database:** where migrations live and how they're applied today.
- **Feature switches:** whether a flag mechanism exists.
- **Risk map:** which areas would be **small**, **wide** or **closed** here (closed = hard to undo: migrations,
  production data, payments, auth, privacy, new packages).
- **Known flaky tests**, if CI history or the docs mention any.

End with: the proposed layout (Step 3), a table of proposed placeholder values, and open questions.
If the project is a self-contained GitHub repo and I'd rather work in the cloud, also say whether Claude Code
**Projects** (public beta, Pro and Max) would suit me better than this template. It can't adopt local sessions and
gives every thread the same model, so recommend it only if neither matters here. I decide whether to continue.

## Step 3. Adapt the rules to this project

**Layout.** The workflow expects a **workspace** folder:

```
<workspace>/              ← open Claude Code here; small git repo of its own (tracks PLAN.md history)
├─ CLAUDE.md · ORCHESTRATOR.md · PLAN.md · .claude/ · .gitignore
├─ {{CODE_DIR}}/          ← the code repo, a fresh clone from GitHub; always stays on the main branch
├─ _worktrees/build/      ← a second checkout of the code repo, where helpers do all coding
├─ backlog/               ← feature ideas, one file each
└─ ops/                   ← production scripts; only I run them
```

The orchestrator's files live outside the code repo so `PLAN.md` can be committed at every stage, even though the
code repo's main branch is protected. Recommend how to get there without moving my existing folder (usually: a new
workspace with a fresh clone, keeping the old folder untouched as a backup). If my project needs a different layout,
explain the trade-off and ask.

**Values.** Fill in every placeholder:

| Placeholder | Meaning | Example |
|---|---|---|
| `{{PROJECT_NAME}}` | Project name | Acme Booking |
| `{{PROJECT_SUMMARY}}` | 2–4 lines: what it is, who uses it, what "live" means | |
| `{{OWNER}}` | The human who decides (a name, or "the owner") | Sam |
| `{{CODE_DIR}}` | Code repo folder inside the workspace | `app` |
| `{{MAIN_BRANCH}}` | The code repo's main branch | `main` |
| `{{GITHUB_REPO}}` | GitHub repo as `owner/name` | `acme/booking` |
| `{{GITHUB_ACCOUNT}}` | The `gh` account agents should use | `sam-dev` |
| `{{TEST_COMMAND}}` | Runs one test file (the file is appended) | `npx vitest run` |
| `{{FULL_TEST_COMMAND}}` | Runs the whole suite | `npm test` |
| `{{CHECK_COMMAND}}` | Type check or lint | `npm run typecheck` |
| `{{SECRETS_DIR}}` | Folder outside the project that holds real keys. In settings `Read`/`Edit` rules write absolute paths as `//c/path` or `~/path` | `~/secrets` |
| `{{MIGRATION_TOOL}}` | The command that applies migrations (blocked for agents) | `prisma migrate deploy` |
| `{{PROD_CLI}}` | The production / hosting CLI (blocked for agents) | `vercel` |

**Judgement spots.** Resolve every `<!-- ADAPT: ... -->` with this project's real facts: label examples, high-risk
areas, the reviewer's product rules, the adversarial reviewer's attack angles, machine traps, migration steps,
test commands. Keep good rules from my existing `CLAUDE.md`. Ask me for the 3-line Vision in `PLAN.md`.
Build the Roadmap from the backlog or open issues, and propose a small, safe first trial (one wording change, or one test).

**Settings.** Remove rules that don't apply (e.g. the PowerShell lines on macOS or Linux, the `{{PROD_CLI}}` line if
there is none). Add deny rules for any other production script by name. Keep `"attribution": {"commit": "", "pr": ""}`
unless I want AI attribution lines.

**The after-compaction hook.** `settings.json` has two SessionStart hooks: one runs `now-after-compact.ps1`
(Windows PowerShell), the other `now-after-compact.sh` (bash). Claude Code has no per-system switch for hooks, so
**keep exactly one**: the PowerShell one on Windows, the bash one on macOS or Linux. Leave the other script out of
the drafts. Keep `"autoCompactWindow": 600000` (a plain number) unless I ask otherwise; `ORCHESTRATOR.md` §12 says why.

Write the results to `_setup/drafts/` (not into the project yet), then prove nothing is left:
search the drafts for `{{` and `ADAPT:`, and check that `settings.json` parses as JSON.

## Step 4. Install, one sub-step at a time (a separate "yes" for each)

**4a. Settings hygiene.** Propose removing broad allow rules from the project's `.claude/settings.local.json`.
Report what my global `~/.claude/settings.json` allows; I decide.

**4b. Production secrets out of the project** (I do the hands-on parts; you guide). Give me a checklist: which
variables get local or test values, which get removed, and where the real values should live instead
(the hosting provider, or `{{SECRETS_DIR}}`). Don't read the files. If real production keys were in reach of an AI
agent, give me a key-rotation to-do list, most dangerous first (database, hosting, payment, email).
Afterwards, tell me how to confirm the tests still pass locally.

**4c. Workspace.** Create the layout from Step 3: the fresh clone in `{{CODE_DIR}}/`, `backlog/`, `ops/`,
`_worktrees/`. Move production scripts into `ops/` (move, never delete). Show me the final top-level tree.

**4d. Build worktree.** `git -C {{CODE_DIR}} fetch`, then `git -C {{CODE_DIR}} worktree add --detach ../_worktrees/build origin/{{MAIN_BRANCH}}`.
Set up its dependencies (this asks me) and run one test to prove it works.

**4e. First code-repo PR (docs only, no app code).** In `_worktrees/build`, create the branch with
`git -C _worktrees/build switch -c feat/orchestrator-rules --no-track origin/{{MAIN_BRANCH}}`, add the adapted `code-repo/CLAUDE.md`
(merge it with any existing one) and `.github/pull_request_template.md`, commit, push the branch, and open the PR
using the template. Wait for CI to pass, then tell me it's ready. **I merge.**

**4f. Branch protection** (I click; you guide). Walk me through a GitHub ruleset on the main branch:
- require a pull request, with **0 required approvals** (GitHub won't let me approve my own PR);
- require the CI checks found in the audit;
- block force pushes and deletion;
- an **empty bypass list**, so the rules bind my own login too. The agents use my login.

**4g. Install the orchestrator files.** Copy the drafts into the workspace: `CLAUDE.md`, `ORCHESTRATOR.md`,
`PLAN.md`, `.claude/settings.json`, `.claude/agents/*.md`, the one hook script you kept in `.claude/hooks/`, and
`gitignore` as `.gitignore`. Run `git init` in the
workspace and commit. Then tell me to **restart**: helpers and settings load only in a fresh session.
In the new session I'll paste: *"Continue the install from `_setup/PROGRESS.md`. The steps are in `<PATH>/../INSTALL-PROMPT.md`."*

## Step 5. Check that everything loaded (fresh session)

- Tell me which helper types you can use. They must be exactly the seven custom ones; Claude's built-in helpers are blocked.
- Run three tiny delegations: ask `implementer`, `reviewer-light` and `scout` to reply "OK" and do nothing else.
  I'll check each one's model and effort in the task list.
- Try `gh pr merge --help`. It must be **blocked** by a deny rule.
- Test the after-compaction hook: run its script once yourself, with `CLAUDE_PROJECT_DIR` set to the workspace. It
  must print the Now section of `PLAN.md`. Then ask me to run `/hooks` and confirm a SessionStart hook with matcher
  `compact` is listed.
- Ask me to confirm the session defaults to Opus at high effort (`/status` or the model picker).
- Explain the Fable gate: the "ask" rule on `adversarial-reviewer` may **not** stop a helper from starting,
  so the real gate is the written rule in `ORCHESTRATOR.md` §7. Don't start it to test this.

## Step 6. First trial

- Set `PLAN.md` "Now" to "ready for the first trial" and commit.
- Give me a short summary of what was installed, and the start line for a fresh session:
  *"You're the orchestrator. Read ORCHESTRATOR.md, then the Now section of PLAN.md, and report."*
- I run the first trial (the small task from Step 3) through the whole loop in that session.
- Afterwards, in any session: fill in the Trial log in `PLAN.md` (checks passed first time, review rounds,
  permission pop-ups), propose 0–2 rule changes, and move `_setup/` to `_setup-done/` once I agree.
