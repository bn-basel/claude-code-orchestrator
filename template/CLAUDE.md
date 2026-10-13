# Shared rules for every agent

Code rules are in `{{CODE_DIR}}/CLAUDE.md`.

## What this is

{{PROJECT_SUMMARY}}

<!-- ADAPT: say what a merge does. Example: "Merging to `main` deploys to production, where real customers use it." -->
Merging to `{{MAIN_BRANCH}}` deploys to production.

Owner: **{{OWNER}}**. They make the decisions.

## Talking to {{OWNER}}

Every chat in this project follows the **Voice** section of `.claude/output-styles/orchestrator.md`. In short:
<!-- ADAPT: the short version of the owner's Voice answers, 3–4 lines. -->
- Plain, short English; define a technical term the first time you use it.
- The answer or recommendation first, then a one-line reason. Say when you're unsure; never "done" without checking.
- Never ask for a password, key or token in chat.

## Where things are

| Path | What it is | Agents may… |
|---|---|---|
| `PLAN.md` | The one living record: Now · Roadmap · Current feature · Decisions log | read (only the orchestrator edits it) |
| `backlog/` | Feature ideas, one file each | read |
| `{{CODE_DIR}}/` | **Code repo** (own git, branch `{{MAIN_BRANCH}}`) | read only. **All code work happens in `_worktrees/build`** |
| `_worktrees/build` | The permanent build worktree of `{{CODE_DIR}}` | work here, on the branch you were given |
| `_ui-evidence/` | Screenshots from `ui-tester` | read |
| `ops/` | Production scripts | **never run, never edit** |
<!-- ADAPT: add folders agents must not read without asking (business documents, archives). -->

- Searches started from this top folder **skip `{{CODE_DIR}}/`**, because it's gitignored here. Search inside `{{CODE_DIR}}/` or `_worktrees/build` instead.
- **Always branch from `origin/{{MAIN_BRANCH}}`** (GitHub's copy), because the local `{{MAIN_BRANCH}}` may be old.

## Safety: never

- Push to `{{MAIN_BRANCH}}`, merge a PR, force-push, or rewrite history.
- Read, print or copy secrets: `.env*` files, anything in `{{SECRETS_DIR}}`, keys, tokens, passwords. Never print HTTP error bodies or headers (they can contain keys).
- Connect to anything in production (database, hosting, third-party APIs, email). **Confirm the host of every database connection is local.**
- Put real customer or user data into your work. Use **made-up test data only**.
- Add a package or dependency, or touch these high-risk areas, unless the task explicitly says so: <!-- ADAPT: e.g. authentication, payments, the privacy filter, an AI model's tool list -->.
- Switch branches in `{{CODE_DIR}}/` itself; use `_worktrees/build`.
- Start your own helpers (subagents).

If a task seems to need any of the above: **stop and report**. Don't work around it.

## How we work (short version)

- Every task has a **label**: **small** (easy to undo), **wide** (easy to undo, but many parts depend on it), or **closed** (hard to undo). Higher labels get more checks.
- Every task has a **"Done when"**: the checks it must pass. Work isn't done until they pass.
- Stay inside the **files allowed** in your task. If you need another file, stop and report.
- **Frozen tests**, when listed, must not be edited.
- If anything is unclear: **stop and report. Don't guess.**
- Never write a planned step as a completed fact, in code, docs, commits or reports.
- If a task turns out to be already built, say so and stop.
- Reports are short and factual: what changed, which checks ran and their results, and concerns. No essays.
- To prove old wording is gone, search for its **one distinctive word**, not the whole phrase: a phrase search misses text split across a line break. If the new wording contains the old word, exclude the new form from the search.
- Never add "Co-Authored-By" lines or "Generated with Claude Code" to commits or PRs.

## Machine traps

- Change files only with the **Edit and Write tools**. No `sed -i` and no ad-hoc scripts that rewrite files: those skip the permission rules and leave no clear record.
- **Never run a command that waits for input without giving it any** (e.g. `cat > file` with nothing piped in). It hangs in the background for hours.
- **Run git as `git -C <folder> …`**, e.g. `git -C _worktrees/build status`. Never `cd <folder> && git …`: Claude Code
  asks for approval every time, because git in another folder can run that folder's hooks. Never `cd` in one command and
  git in the next: the folder isn't kept between commands, so git runs in the wrong repo. `--git-dir` and `--work-tree`
  are blocked. Other commands may still use `cd <folder> && <command>`, e.g. to run tests.
- **Write folders exactly as the rules do: relative to this workspace, with forward slashes** (`git -C _worktrees/build …`,
  `git -C {{CODE_DIR}} …`). A full path (`C:\…`, `/c/…`) or backslashes don't match the allow list, so the command is
  blocked or asks for approval.
- Don't add `; echo $?` or other `$` variables to a command: Claude Code can't check them and asks for approval. The
  tool already reports the exit code. Run one command per call rather than chaining several with `;`.
- If more than one GitHub account is logged in, `gh` can drift to the wrong one. The right one is **{{GITHUB_ACCOUNT}}**. Check with `gh auth status`.
- To confirm a deploy, use **GitHub statuses**. A health endpoint usually can't show which version is live.
<!-- ADAPT: add your own traps. Examples: "Windows shell: no heredocs." · "Set PYTHONIOENCODING=utf-8 before printing non-English text." · "The database stores UTC; the test store uses local time. Never mix them without converting." -->

## Quality basics (details in `{{CODE_DIR}}/CLAUDE.md`)

- **Add-only database changes.** Add tables and columns; renaming or deleting happens later, separately.
- **New tests must fail on the old code** (`origin/{{MAIN_BRANCH}}`). A test that passes either way proves nothing.
- **A task that touches shared test setup** (fixtures, test database helpers) runs the whole affected suite in its Done-when checks, not only its own file.
- **Nothing is "done" until a real production path uses it.** A test calling it isn't enough.
- New customer-facing features ship behind a **feature switch**, on for one test account first. Wording changes and bug fixes don't need one.
- **Real-world checks are the final gate** (a real device, a real model run) for anything they touch. {{OWNER}} runs them.
