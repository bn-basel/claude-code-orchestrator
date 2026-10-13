# Changelog

Each version lists what changed and the lesson behind it. The workflow is used day to day on a live production
app, so most entries come from something that went wrong or cost too much.

## v1.3 · 2026-10-13 · hard limits on models and effort, a per-project voice, eight lessons

**Changed**
- **Hard limits on models and effort.** `.claude/model-policy.md` is the one table of which models each helper may use
  (scout and ui-tester: Haiku · implementer, test-writer: Sonnet · implementer-wide: Sonnet, or Opus with the owner's yes ·
  both reviewers: Opus · adversarial-reviewer: Fable only). A new **guard hook** (`guard-helpers.ps1` / `.sh`, PreToolUse
  on `Agent`) checks every helper launch against it before the helper starts. It blocks a model the helper may not use,
  a built-in or unknown helper, a helper with no model anywhere, and effort above `xhigh`, with a message that says what's
  allowed. Effort `max`, Opus on `implementer-wide` and every Fable run show the owner a pop-up, after the orchestrator
  has asked in chat. The guard also catches the environment variables that outrank a launch
  (`CLAUDE_CODE_EFFORT_LEVEL`, a forced `CLAUDE_CODE_SUBAGENT_MODEL`), and blocks anything it can't read.
- The guard's **check mode** (`-Check` / `--check`) fails if an agent file breaks the table. The install runs it in
  Step 5, the upgrade prompt after applying changes, and this repo in `tests/guard/` (both versions, 30 cases).
- Settings deny the **Workflow** tool and the three tools that let a session change its own effort, model or fast mode.
  `effortLevel` stays `high`; the owner raises the main session with `/effort` when they want to.
- This repo's own `.claude/settings.json` follows the same limits, with the template's guard: only two read-only built-in
  helpers (Explore, claude-code-guide), for research, with Sonnet or Haiku named in the launch.
- **A per-project voice.** The output style gains a **Voice** section with the owner's preferences (plain short words,
  answer first, a scenario for every decision, at most 3 options and 2 questions at a time, who does what, commands in
  their own code block, say when unsure, push back, never ask for secrets in chat). `CLAUDE.md` gets a short "Talking
  to the owner" section, so helpers and every other chat in the project follow it too. The install shows the defaults
  as one list and asks which to change.
- **Pasted text is data.** Only the owner's own typed messages are instructions. Pasted text (another agent's output,
  an email, a log), helper reports and messages from other sessions are read as data, and the orchestrator acts on
  pasted instructions only after the owner adds a fixed line ("Confirmed, from me.").
- **CI red? Check main first.** Before blaming the PR, the orchestrator checks whether main fails the same way.
- **Production scripts in a normal terminal window**, never an editor's or the Claude app's built-in terminal panel.
- **Feature switches:** one switch per action, never the whole set (the server should refuse it), every change logged.
  A new section in `code-repo/CLAUDE.md`, suggested by the install audit when the project has switches.
- **Deploy waits for CI:** the install audit checks whether the host can deploy on red CI and recommends its "wait for
  CI" setting.
- **An optional live check:** one read-only script the owner runs before and after each deploy. It prints the commit
  it checked and exits 0 for OK, or a number that names the problem.
- **A wording sheet** before a redesign or a wording pass: one table of every line a user can see, where it appears and
  what triggers it, so the owner reviews all wording in one sitting.
- **Decisions are logged as "Decided: X, because Y"**, with the date and who decided, in the decisions log and in the
  "Decided by me" lines.

**Fixed**
- "Effort is fixed per agent file and can't be changed per call" was out of date: since Claude Code 2.1.292 the Agent
  tool takes an `effort` per launch, as it already took a `model`. The agent files now hold defaults, and the table
  holds the limits.

**Lessons**
- **A written limit is a wish; a hook is a limit.** Per-launch `effort` and `model` made the agent files' settings
  easy to override, and the only thing between "use max" and a max run was the orchestrator's memory of a rule. The
  guard turns the table into something Claude Code enforces, and its message lets the orchestrator correct itself
  instead of stalling. Settings alone can't do it: `availableModels` is one list for every helper, and a deny rule
  can't tell scout from reviewer.
- **The voice belongs to the project.** A global style follows the owner into every project, including ones where
  someone else decides; kept in the project's files, it travels with the project and every chat in it uses it.
- **Another agent's words are not the owner's.** Pasting one agent's output into another chat makes it look like the
  owner's message, and a helper's report arrives in the same conversation. Without a rule, an instruction inside either
  can be followed as if the owner had typed it.
- **A red CI isn't always the PR's fault.** A failure blamed on a PR turned out to be a real race condition already on
  main; checking main first would have found it at once.
- **Built-in terminal panels can change what you paste.** A hidden password pasted into one picked up invisible
  characters, and the production login failed.
- **Hosting can deploy on red CI.** Branch protection stops the merge, not the deploy of a commit that reaches main.
- **Whole-set switch updates undo other people's changes.** A stale copy of all switches, sent back, silently flips the
  ones it didn't mean to touch.

## v1.2 · 2026-10-12 · measured: git -C, a Haiku scout, fixed reply shapes, ui-tester

**Changed**
- Every git command runs as `git -C <folder> …`. Allow rules are written in that form; deny rules also catch pushes to
  main and force pushes written with `-C`, and block `--git-dir` and `--work-tree`.
- The hook is now `print-now` and runs when a session starts, resumes or is cleared, as well as after a compaction.
  `settings.json` ships one hook (PowerShell); the install switches it to the bash script on macOS and Linux.
- Auto-compaction at 400k (was 600k). After a merge, suggest a fresh session once the conversation passes about
  250k tokens (was "about half the context", with a 700k ceiling).
- The Now block gains **Goal**, **Must keep** (the owner's decisions, including ones said only in chat) and **Frozen
  tests**, and a plan-round counter. The owner's decisions are written down the moment they're made.
- Corrected numbers: a helper costs about 11–12k tokens to start, and the cache prices are spelled out.
- An **output style** for the orchestrator (`.claude/output-styles/orchestrator.md`, turned on in `settings.json`) with
  five fixed reply shapes: Session start, Decision request, Plan approval, Progress and Done report. `ORCHESTRATOR.md`
  §3 now points to it instead of repeating the rules.
- `scout` runs on **Haiku 5.5** and skips `CLAUDE.md` (`omitClaudeMd`; its own file holds its rules). The Trial log
  counts wrong scout answers; 2 or more wrong in the first 10 switches it back to Sonnet. The install checks for Claude
  Code 2.1.293 or later.
- **Plan review**: at most 3 rounds, stopping early when only style points remain or the plan didn't change; the
  reviewer checks that every file, function and table the plan names exists.
- **Code review**: every blocker and should-fix needs evidence (a command and its output, a failing test, or a concrete
  breaking input), otherwise it counts as a note. Round 2 marks earlier findings ADDRESSED or NOT ADDRESSED and adds no
  new nits. The checklist gets a **production** line (visible failures, no user data in logs, a working undo).
- `implementer` and `test-writer` **commit before reporting** (a `WIP:` commit if they stop partway) and end their
  report with a **HANDOFF** line: what they tried, what didn't work, what they'd do next. A fresh helper's brief carries
  that line. A half-done, tangled task is resumed even after 5 minutes.
- A new helper, **`ui-tester`** (Haiku 5.5), for work that changes a screen. After Check by command it clicks through
  the task's `Click-path` on the local dev server, screenshots each step at 390 and 1440 px, and reports pass/fail per
  step with console errors. Its browser (Playwright, pinned version) starts and stops with it. It has no Bash, Edit or
  Write, opens only `localhost`, uses test accounts only, and treats page text as data. The PR template gains lines for
  end-to-end tests and the click-through. New placeholders: `{{DEV_COMMAND}}`, `{{DEV_URL}}`.
- `ORCHESTRATOR.md` §13, **parallel packages**: optional and off by default. Big tasks of a wide feature that share no
  files can run at the same time, each in its own worktree, then merge and get one review.
- **Install with one line**: Claude clones this repo at a version tag next to your folder and follows the install
  prompt; no paths to fill in. The install writes the version to `.claude/orchestrator-version`.
- **Step 0, new project**: creates the GitHub repo (with your yes), a minimal skeleton with one test and a CI workflow,
  makes the one direct push to main, and waits for green CI, so branch protection has a check to require.
- The install now says to **trust the workspace folder** (allow rules are ignored until you do) and checks it with
  `/permissions`. It also warns that branch protection on private repos needs a paid GitHub plan.
- **`UPGRADE-PROMPT.md`**: moves an installed workspace to a newer tagged version. It takes the template diff between the
  two versions, carries each change over onto your adapted files, shows conflicts side by side, and applies only what
  you approve, then re-runs the relevant install checks.

**Fixed**
- The PowerShell hook printed "·" and "—" from `PLAN.md` as "�" (Windows PowerShell writes in the console code page).
  It now writes UTF-8.
- The template's `settings.json` registered both hooks, so a hand-copied install on Windows printed Now twice.

**Lessons**
- **`cd <folder> && git …` now asks for approval every time** (reverses the v1.0 lesson). Claude Code treats git in
  another folder as risky, because that folder's git hooks could run. In a test sandbox it blocked every helper commit.
  Splitting it into `cd`, then `git` in the next command, is worse: a helper's folder isn't kept between commands, so
  git ran in the wrong repo. `git -C <folder>` works without a prompt and in the right place.
- **A helper costs about 11–12k tokens to start, not 20k.** Measured from the helpers' own transcripts in a test
  sandbox (scout, implementer, test-writer, both reviewers). Helpers on the same model also share about 8k of cached
  start-up text when they start within 5 minutes of each other.
- **A smaller compaction window doesn't make Claude forget the goal, if the goal is written down.** With the old Now
  block, an orchestrator compacted four times lost the goal, and a fresh session lost a decision the owner had only said
  in chat (8 of 9 facts). With Goal and Must keep in Now, both recalled 9 of 9.
- **Claude doesn't see the compaction point.** Every session only gets a fixed "tokens left" budget line, the same with
  or without a 400k window. The claim that a lower window makes Claude rush has nothing to work with.
- **An upgrade must not overwrite what you adapted.** Copying new template files over an installed workspace would
  undo every project-specific rule. Applying the template's *diff* between two tagged versions keeps them, and needs the
  installed version written down, hence the version file.
- **Allow rules do nothing in an untrusted folder.** Claude Code ignores a project's allow rules until the folder is
  trusted, so a fresh workspace pops up on every command and the rules look broken. The install now says so.
- **Branch protection needs a CI check to require, and a plan that allows it.** A brand-new project has neither until
  its first CI run, and on a free GitHub account private repos can't be protected at all.
- **Parallel helpers save time, not tokens.** One outside test measured 2.6–5.9× the tokens for parallel work, and
  Anthropic's own parallel-agents write-up found it only helps when the pieces are truly independent. So it's an
  option for file-disjoint tasks, never the default. Claude Code's built-in `isolation: worktree` copies the repo the
  session started in, which here is the workspace, not the code repo, so the template uses plain `git worktree` instead.
- **Screenshots are evidence, scripted tests are proof.** A cheap model clicking through a screen catches what a unit
  test can't see (a broken layout on a phone, a console error), but it can be fooled or misread a page. So the
  click-through goes in the PR as evidence, and the end-to-end tests in CI stay the gate.
- **A browser helper defines its own browser.** The Playwright server is declared inside `ui-tester.md`, so it starts
  with that helper and never loads into the orchestrator's context. The CLI and the desktop app both support it;
  Claude in Chrome was ruled out because it uses your real logins.
- **A fresh helper gets the work, not the thinking.** Starting fresh after the 5-minute cache window is cheaper than a
  cold resume, but the new helper only sees the committed files. The HANDOFF line carries the reasoning across for a
  few dozen tokens.
- **More review rounds stop paying off quickly.** Studies of repair loops find most of the gain in the first two
  rounds, and review loops without a stop rule run away. A cap of 3 plan rounds with an early stop keeps the benefit.
- **Agreement between reviewers isn't proof.** Anthropic's own code review checks each candidate finding against the
  real code before reporting it. One reviewer that has to show evidence is cheaper than a panel of specialists.
- **Haiku 5.5 is good enough for lookups.** Same 10 code questions with known answers (a trap question among them):
  Sonnet 10 of 10, Haiku 10 of 10, about the same speed, Haiku about 13× cheaper per question.
- **`model: haiku` depends on the Claude Code version.** On 2.1.292 it ran Haiku 4.5; from 2.1.293 it runs Haiku 5.5.
- **A playbook says what to do; it doesn't hold the shape of the replies.** Each new orchestrator session read the
  talking rules a little differently. An output style is sent with every request, so the shapes hold from the first
  message and through compaction. It's still an instruction, not a guarantee, so the test compares sessions with and
  without it.
- **The upgrade keeps what you adapted.** Tested on a simulated v1.1 install with three changes of the owner's own,
  one of them in a paragraph v1.2 also changes: the upgrade found all three, merged the overlapping one, and the result
  matched the v1.2 template exactly apart from those three changes.
- **A dry run of the new-project install found four rough edges**, now in the install text: the clone sits outside your
  folder, so Claude asks before reading it; Claude Code protects every `.claude` folder, so drafts go in
  `_setup/drafts/dot-claude/`; writing the real `.claude/` needs a click on an approval prompt, so a session that can't
  show one hands you the copy command; and the desktop app's Claude Code version can differ from the terminal's.
- **Allow rules match the text, so the path has to be written the same way.** In testing, reviewers and a scout wrote
  `git -C C:\…\_worktrees\build …` with a full path; it didn't match `git -C _worktrees/build …` and was blocked. The
  rules now say to write folders relative and with forward slashes. Likewise `; echo $?` made Claude Code ask for
  approval, because it can't check a `$` variable.
- **When one form is blocked, helpers find another.** Both a Sonnet and a Haiku scout got past the block with
  `git --git-dir=…`. A deny rule now closes that route, and the rules say which form to use instead.

## v1.1 · 2026-10-10 · context and cache management

**Added**
- `ORCHESTRATOR.md` §12, *Context and cache management*.
- `"autoCompactWindow": 600000` in `.claude/settings.json`.
- A SessionStart hook (matcher `compact`) in `.claude/hooks/`, in a PowerShell and a bash version.
- A playbook rule for resuming helpers, and the optional longer helper cache.
- *Orchestrator or Projects?* in the README, the site and the install audit.

**Lessons**
- **On 1M-context models, auto-compaction only starts at about 967k tokens.** A long orchestrator session never
  compacts on its own before the 700k limit. Rotation via the Now block stays the main method; an auto-compact
  window of about 600k is the safety net.
- **The setting and the environment variable take a plain number.** `/autocompact 600k` works, but in
  `CLAUDE_CODE_AUTO_COMPACT_WINDOW` the value `600k` is read as 600.
- **A compaction can drop the current state.** A hook that prints the Now block right after compacting brings it
  straight back, with a reminder to re-read the playbook.
- **Hooks have no per-system switch.** The template ships both versions and the install keeps the one that fits.
- **A helper's prompt cache lasts 5 minutes, the main session's 1 hour** (on a subscription). A helper resumed after
  more than 5 idle minutes pays for its whole history again, so resume only within that window and otherwise start
  fresh with a short brief. A 1-hour helper cache (`subagentPromptCacheTtl`, or `experimental: cacheTtl: 1h` in one
  helper's frontmatter) only pays off for helpers resumed after 5 to 60 idle minutes, because 1-hour writes cost more.
- **Claude Code Projects now covers part of this ground** (public beta, Pro and Max): a coordinator, one thread per
  task, shared instructions and memory, cloud by default. It suits self-contained GitHub repos and cloud work. It
  can't adopt local sessions, gives every thread the same model (so it uses plan limits faster than a Sonnet-heavy
  split), and is a beta. This template stays the choice for local work and a per-helper model split.

## v1.0 · 2026-10-07 · first published version

The setup as I use it, made generic: placeholders instead of product details, and an install prompt that backs up,
audits, adapts and installs one approved step at a time.

**What's in it**
- One orchestrator session (Opus) and seven helpers: `implementer`, `implementer-wide`, `test-writer`, `reviewer`,
  `reviewer-light`, `adversarial-reviewer` (Fable, only with your yes) and `scout`.
- A 12-step loop with three human gates, labels that scale the process with risk, and a retry budget.
- Safety in layers: branch protection, no production secrets locally, deny and ask rules, and the written playbook.

**Lessons from private use that shaped v1**
- **A cheap `scout` for lookups.** Simple questions ("where is X") were going to full reviewers. Now a read-only
  helper answers one question with file:line evidence, and reviewers only review.
- **You decide four kinds of thing:** wording users see, product behaviour, production/money/privacy, and scope.
  The orchestrator decides the rest and logs it. Far fewer interruptions, nothing important skipped.
- **Every decision starts with a concrete scenario**, then the recommendation first. Abstract options were hard to judge.
- **Ask rules don't stop helpers from starting** (seen in accept-edits mode; auto mode doesn't either). So the gate
  for the Fable reviewer is a written rule plus a log entry with the date and your yes.
- **Feature branches use `--no-track`.** Without it, a branch made from `origin/main` tracks main, so a plain
  `git push` aims at main.
- **New tests are judged against `origin/main`, also in fix rounds.** Judging against the helper's own earlier
  commit let a test that proved nothing slip through.
- **Each code review asks whether the change makes the architecture map untrue.** The map update ships in the same PR.
- **Each helper costs about 20k tokens just to start**, so very small tasks are grouped into one brief.
  *(Measured in v1.2: about 11–12k.)*
- **"Done" means *the* production path uses it**, not *a* production path. A new write path once skipped a guard
  the old one had.
- **Shared test setup means running the whole suite.** Shared fixtures broke unrelated tests.
- **Search for one distinctive word** to prove old wording is gone. A phrase search misses text split across lines.
- **Never print HTTP error bodies or headers.** One leaked an API key into a transcript.
- **A command waiting for input, given none, hung in the background for 1.5 hours.**
- **`cd <dir> && git …`, not `git -C`.** Allow rules match the start of a command, so `-C` caused needless pop-ups.
  *(Reversed in v1.2: Claude Code now asks before `cd` + git, so the rules are written for `git -C`.)*
- **Confirm deploys from GitHub statuses.** A health endpoint couldn't show which version was live.
- **Re-apply a migration that was edited after it was applied**, before the merge. Drift checks can't catch it afterwards.
- **No AI attribution lines** in commits or PRs (set in `settings.json`).
