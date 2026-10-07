# Changelog

Each version lists what changed and the lesson behind it. The workflow is used day to day on a live production
app, so most entries come from something that went wrong or cost too much.

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
- **"Done" means *the* production path uses it**, not *a* production path. A new write path once skipped a guard
  the old one had.
- **Shared test setup means running the whole suite.** Shared fixtures broke unrelated tests.
- **Search for one distinctive word** to prove old wording is gone. A phrase search misses text split across lines.
- **Never print HTTP error bodies or headers.** One leaked an API key into a transcript.
- **A command waiting for input, given none, hung in the background for 1.5 hours.**
- **`cd <dir> && git …`, not `git -C`.** Allow rules match the start of a command, so `-C` caused needless pop-ups.
- **Confirm deploys from GitHub statuses.** A health endpoint couldn't show which version was live.
- **Re-apply a migration that was edited after it was applied**, before the merge. Drift checks can't catch it afterwards.
- **No AI attribution lines** in commits or PRs (set in `settings.json`).
