# Install prompt

This prompt installs the orchestrator workflow into **your** project, one approved step at a time. Claude does the work;
you say "yes" at every step and do the few hands-on parts yourself (secrets, branch protection, merging).

**Start it with one line.** Open Claude Code (version 2.1.293 or later) in the folder that **contains** your project
folder, or in an empty folder for a new project. Use Opus at high effort, in the **default (ask) permission mode**, so
you see every change. Then type:

```
Install the Claude Code Orchestrator v1.2 here: clone https://github.com/bn-basel/claude-code-orchestrator at tag v1.2 next to this folder, then follow its INSTALL-PROMPT.md.
```

Claude asks before it clones (a download) and before it reads the clone (it's outside your folder), then reads this
file and follows it from the line below. To do it by hand
instead: clone the repo next to your project, at the tag you want, and paste everything below the line.

You need the `gh` command-line tool, logged in to your GitHub account. If the project isn't on GitHub yet, Step 0
creates the repo. It takes about an hour, plus one feature for the trial. You can stop at any step: progress is saved
in `_setup/PROGRESS.md`.

---

You are installing the **Claude Code Orchestrator** workflow into my project.
Template folder: the `template/` folder next to this file, in the orchestrator clone. If you can't find it, ask me
before doing anything. Note the clone's tag (`git -C <clone> describe --tags`): it's the installed version.

**What it is:** one orchestrator session plans features with me in plain language, hands each small task to a
specialised helper (subagent), checks every change by running commands, and opens one pull request per feature.
I approve the plan and click merge. The template has:

- `CLAUDE.md`: shared rules every agent loads · `ORCHESTRATOR.md`: the orchestrator's playbook · `PLAN.md`: the living record
- `.claude/settings.json`: allow / ask / deny permission rules, the auto-compact window, the output style and a hook ·
  `.claude/output-styles/orchestrator.md`: the orchestrator's fixed reply shapes ·
  `.claude/agents/`: the eight helpers · `.claude/model-policy.md`: which models each helper may use ·
  `.claude/hooks/`: the "print Now" hook and the helper guard (Windows and macOS/Linux versions of each)
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
- Never push to the main branch, merge, force-push or rewrite history. The one exception is the "Initial skeleton"
  push in Step 0, for a brand-new repo, after my yes.
- **Never delete anything.** Move files into `_setup/moved/` instead, and tell me.
- Start no helpers (subagents) unless a step says so.
- Run git as `git -C <folder> …`. Never `cd <folder> && git …` (Claude Code asks for approval every time) and never
  `cd` in one command with git in the next (the folder isn't kept, so git runs in the wrong repo).
- If something doesn't match what the template expects: **stop and ask**. Don't guess.

## Step 0. New project (only if there's no code repo yet)

Skip this step if the project already has a GitHub repo.

1. Ask me: the project's name, what it is (2 lines), the stack (offer 2–3 plain choices that suit it, e.g.
   "Python with pytest" or "TypeScript with Vitest"), and which `gh` account to use (`gh auth status`).
2. **Private or public.** Branch protection (Step 4f, the strongest safety layer) works on **public** repos with a free
   GitHub account, but on **private** repos only with GitHub Pro or a paid team plan. Explain this, recommend one, and
   let me choose.
3. **Create the repo**, which publishes something under my account: show the exact command and wait for my yes.
   `gh repo create <account>/<name> --private|--public --description "<one line>"`. Clone it into the workspace as
   `{{CODE_DIR}}/`.
4. **A minimal skeleton.** Show it before writing: one source file with one small function, **one test** for it, a
   README (what it is, how to run the test), a `.gitignore` for the stack, and a CI workflow
   (`.github/workflows/ci.yml`) that runs the tests on every pull request and on pushes to main. Use only the stack's
   standard test runner; that's the one new package, and I approve it. Pin the workflow's actions to a version, using the
   newest major version of each (older ones run on a retired Node.js and print warnings).
5. Run the test locally. It must pass.
6. **The one direct push to main.** No protection exists yet, so this is the only time: commit "Initial skeleton" and
   push it, after my yes.
7. Wait for the CI run on main to go green (`gh run list`, `gh run view`). Note the check's name: Step 4f requires it.
8. Continue with Step 1. The audit will find this skeleton.

## Step 1. Backup

- In the code repo: report uncommitted changes (I decide what to do with them), then create a local tag
  `pre-orchestrator-<date>` on the current commit. Don't push it.
- Copy any existing Claude setup (`CLAUDE.md` files, `.claude/` folders, `.mcp.json`) into `_setup/backup/`.
- Ask me to confirm that my production database (if any) has working backups. I check; you don't connect.

## Step 2. Read-only audit

Change nothing except writing `_setup/AUDIT.md`. Find and report:

- **The project:** what it does (2–4 lines, for `{{PROJECT_SUMMARY}}`), languages, frameworks, how it's deployed,
  and whether merging to the main branch deploys.
- **Deploys and CI:** whether the host waits for CI before it deploys (a "wait for CI" or "required checks" setting).
  Hosting can deploy a commit even when its CI is red; if that's possible here, recommend turning the setting on.
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
- **Feature switches:** whether a flag mechanism exists. If it does: does it change one switch at a time, and does it
  log every change? If not, recommend the "Feature switches" rule in `code-repo/CLAUDE.md` (one switch per action, the
  server refuses whole-set updates, every change logged).
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
| `{{DEV_COMMAND}}` | Starts the local dev server (screens only) | `npm run dev` |
| `{{DEV_URL}}` | Where the dev server answers (localhost only) | `http://localhost:3000` |
| `{{CHECK_COMMAND}}` | Type check or lint | `npm run typecheck` |
| `{{SECRETS_DIR}}` | Folder outside the project that holds real keys. In settings `Read`/`Edit` rules write absolute paths as `//c/path` or `~/path` | `~/secrets` |
| `{{MIGRATION_TOOL}}` | The command that applies migrations (blocked for agents) | `prisma migrate deploy` |
| `{{PROD_CLI}}` | The production / hosting CLI (blocked for agents) | `vercel` |

**Judgement spots.** Resolve every `<!-- ADAPT: ... -->` with this project's real facts: label examples, high-risk
areas, the reviewer's product rules, the adversarial reviewer's attack angles, machine traps, migration steps,
test commands. Keep good rules from my existing `CLAUDE.md`. Ask me for the 3-line Vision in `PLAN.md`.
Build the Roadmap from the backlog or open issues, and propose a small, safe first trial (one wording change, or one test).

**Voice.** How every chat in this project should talk to me belongs to the project, not to my global settings. Show
me the default list from the **Voice** section of `.claude/output-styles/orchestrator.md` as one list (it covers
length, tone, how decisions look, how many questions at a time, and language) and ask: "Keep all of these, or which do
you want to change?" Also ask whether the line that turns pasted text into an instruction should stay "Confirmed, from me." (`ORCHESTRATOR.md`
§3). Follow up only on what I change, at most two questions at a time. Write the result into that
Voice section, and its 3–4 most important lines into "Talking to {{OWNER}}" in `CLAUDE.md`.

**Settings.** Remove rules that don't apply (e.g. the PowerShell lines on macOS or Linux, the `{{PROD_CLI}}` line if
there is none). Add deny rules for any other production script by name. Keep `"attribution": {"commit": "", "pr": ""}`
unless I want AI attribution lines.

**The hooks.** `settings.json` has two, both in Windows PowerShell:
- **print Now** (SessionStart): runs `print-now.ps1` when a session starts, resumes or is cleared, and right after a
  compaction;
- **helper guard** (PreToolUse, matcher `Agent`): runs `guard-helpers.ps1` before every helper launch and checks it
  against `.claude/model-policy.md`. It blocks a model the helper may not use, a built-in helper, or effort above
  xhigh, and shows me a pop-up for effort max, Opus on `implementer-wide` and every Fable run.

Claude Code has no per-system switch for hooks, so on macOS or Linux replace each hook's `command` and `args` with
`"shell": "bash", "command": "bash \"${CLAUDE_PROJECT_DIR}/.claude/hooks/<name>.sh\""`, and keep only the `.sh`
scripts in the drafts. The bash guard needs Perl (it ships with macOS and almost every Linux): check with
`perl -MJSON::PP -e 1`. Keep `"autoCompactWindow": 400000` (a plain number) unless I ask otherwise; `ORCHESTRATOR.md`
§12 says why. Keep `"effortLevel": "high"`, and the deny rules for the Workflow tool and for the three tools that would
let a session change its own effort, model or fast mode.

**Model policy.** If I change a helper's model (for example no Fable access, so `adversarial-reviewer` runs on Opus),
change its agent file **and** its row in `.claude/model-policy.md`. Step 5 checks that the two agree.

Write the results to `_setup/drafts/` (not into the project yet). Claude Code protects every folder named `.claude`,
even inside `_setup/`, so put the drafts of `.claude/` files in `_setup/drafts/dot-claude/`. Then prove nothing is left:
search the drafts for `{{` and `ADAPT:`, and check that `settings.json` parses as JSON.

## Step 4. Install, one sub-step at a time (a separate "yes" for each)

**4a. Settings hygiene.** Propose removing broad allow rules from the project's `.claude/settings.local.json`.
Report what my global `~/.claude/settings.json` allows; I decide.

**4b. Production secrets out of the project** (I do the hands-on parts; you guide). Give me a checklist: which
variables get local or test values, which get removed, and where the real values should live instead
(the hosting provider, or `{{SECRETS_DIR}}`). Don't read the files. If real production keys were in reach of an AI
agent, give me a key-rotation to-do list, most dangerous first (database, hosting, payment, email).
Afterwards, tell me how to confirm the tests still pass locally. Whenever I type or paste a real key or password,
I do it in a **normal terminal window** opened on its own (Start menu, Terminal app), not the built-in terminal panel of
an editor or of the Claude app: a hidden password pasted into such a panel once picked up invisible characters and the
login failed.

**4c. Workspace.** Create the layout from Step 3: the fresh clone in `{{CODE_DIR}}/`, `backlog/`, `ops/`,
`_worktrees/`. Move production scripts into `ops/` (move, never delete). Show me the final top-level tree.

**Optional: a live check.** Offer a read-only script I run before and after each deploy, e.g. `ops/live-check`. It
only **reads** production (a health address, the live version, a few key pages or counts), prints the commit it
checked, and exits with a clear code: 0 = OK, 1, 2, 3 … = which problem, listed at the top of the script. Agents can't
write into `ops/`, so draft it in `_setup/drafts/ops/` and I copy it over. Only I run it, in a normal terminal window.

**4d. Build worktree.** `git -C {{CODE_DIR}} fetch`, then `git -C {{CODE_DIR}} worktree add --detach ../_worktrees/build origin/{{MAIN_BRANCH}}`.
Set up its dependencies (this asks me) and run one test to prove it works.

**4e. First code-repo PR (docs only, no app code).** In `_worktrees/build`, create the branch with
`git -C _worktrees/build switch -c feat/orchestrator-rules --no-track origin/{{MAIN_BRANCH}}`, add the adapted `code-repo/CLAUDE.md`
(merge it with any existing one) and `.github/pull_request_template.md`, commit, push the branch, and open the PR
using the template. Wait for CI to pass, then tell me it's ready. **I merge.**

**4f. Branch protection** (I click; you guide). On a private repo this needs GitHub Pro or a paid team plan; on a free
account, say so plainly and let me choose (make the repo public, upgrade, or go on without this wall). Walk me through a
GitHub ruleset on the main branch:
- require a pull request, with **0 required approvals** (GitHub won't let me approve my own PR);
- require the CI checks found in the audit;
- block force pushes and deletion;
- an **empty bypass list**, so the rules bind my own login too. The agents use my login.

If the audit found that the host can deploy on red CI, walk me through its "wait for CI" setting too.

**4f2. ui-tester (only if the project has screens).** It clicks through a changed screen on the local dev server and
screenshots it, using a browser that starts and stops with it. Tell me what it downloads and ask first: the
`@playwright/mcp` package (pinned version in `ui-tester.md`, about 90 KB, from npm) on its first run, plus a Playwright
browser (Chromium, about 150–200 MB, into the user's Playwright folder). Its end-to-end tests in the code repo are a
**new package** in the code repo: that's my decision, in its own PR. No screens: leave `ui-tester.md`, the
`{{DEV_COMMAND}}` rules and `mcp__playwright` out of the drafts. Its browser server is declared inside
`ui-tester.md`, and Claude Code loads such servers only in a **trusted** workspace (see 4g); until then the helper has no
browser and reports every step as FAIL.

**4g. Install the orchestrator files.** Copy the drafts into the workspace: `CLAUDE.md`, `ORCHESTRATOR.md`,
`PLAN.md`, `.claude/settings.json`, `.claude/model-policy.md`, `.claude/agents/*.md`,
`.claude/output-styles/orchestrator.md`, the hook scripts you kept in `.claude/hooks/` (one per hook), and
`gitignore` as `.gitignore`. Run `git init` in the
workspace and commit. Writing into `.claude/` needs my click on an approval prompt (an approval in chat doesn't count). If
this session can't show one, give me the exact copy command for `_setup/drafts/dot-claude/` and I'll run it. Write the installed version (the clone's tag, e.g. `v1.2`) into `.claude/orchestrator-version`;
the upgrade prompt reads it. Then tell me to **restart**: helpers and settings load only in a fresh session.

**Trust the folder.** I open Claude Code in the workspace interactively and accept the trust dialog. Until a folder is
trusted, Claude Code ignores the allow rules in its `settings.json` ("Ignoring N permissions.allow entries"), so every
command would pop up and the rules would look broken.

In the new session I'll paste: *"Continue the install from `_setup/PROGRESS.md`. The steps are in `INSTALL-PROMPT.md`
in the orchestrator clone next to this folder."*

## Step 5. Check that everything loaded (fresh session)

- Tell me which helper types you can use. They must be exactly the custom ones (eight, or seven without `ui-tester`); Claude's built-in helpers are blocked.
- Run three tiny delegations: ask `implementer`, `reviewer-light` and `scout` to reply "OK" and do nothing else.
  I'll check each one's model and effort in the task list.
- **The helper guard.** Run its check mode:
  `powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/guard-helpers.ps1 -Check`
  (macOS/Linux: `bash .claude/hooks/guard-helpers.sh --check`). It must print `OK: 8 agent files match` (7 without
  `ui-tester`). Then launch `scout` with `model: opus`: it must be **blocked** before it starts, with a message naming
  haiku. Don't test the pop-up cases (max, Opus, Fable): they would ask me for real.
- Confirm the Workflow tool is not in your tool list: a deny rule naming a tool removes it.
- Try `gh pr merge --help`. It must be **blocked** by a deny rule.
- Test the "print Now" hook: run its script once yourself with `{"source":"compact"}` piped in and
  `CLAUDE_PROJECT_DIR` set to the workspace. It must print the compaction line and the Now section of `PLAN.md`, with
  "·" and "—" intact. This session's own start should already show the same Now section once (not twice).
- Ask me to run `/permissions` and confirm the allow list shows the workspace's rules. If Claude Code reported
  ignoring them, the folder isn't trusted yet.
- Ask me to confirm the session defaults to Opus at high effort (`/status` or the model picker).
- Check the Claude Code version: **2.1.293 or later**. The desktop app has its own copy; if I also start sessions from a
  terminal, `claude --version` there must pass too, or `model: haiku` runs the older Haiku 4.5. In the scout's
  "OK" run, the task list must show Haiku 5.5. On Amazon Bedrock, Google Cloud or Microsoft Foundry, `haiku` can mean
  an older model: pin `model: claude-haiku-5-5` if your provider offers it, otherwise keep the scout on `sonnet`.
- Check the output style: your first reply in this session must have been the **Session start** shape (Where we are ·
  Next · Blocking). If it wasn't, check `"outputStyle": "Orchestrator"` in `settings.json` and that the style file is
  in `.claude/output-styles/`.
- Explain the gates for Fable, effort max and Opus on `implementer-wide`: the orchestrator asks me in chat first
  (`ORCHESTRATOR.md` §7), then the guard shows me a pop-up at launch. The older "ask" rule on `adversarial-reviewer`
  alone may **not** stop a helper from starting. Don't start one to test this.

## Step 6. First trial

- Set `PLAN.md` "Now" to "ready for the first trial" and commit.
- Give me a short summary of what was installed, and the start line for a fresh session:
  *"You're the orchestrator. Read ORCHESTRATOR.md, then the Now section of PLAN.md, and report."*
- I run the first trial (the small task from Step 3) through the whole loop in that session.
- Afterwards, in any session: fill in the Trial log in `PLAN.md` (checks passed first time, review rounds,
  permission pop-ups), propose 0–2 rule changes, and move `_setup/` to `_setup-done/` once I agree.
