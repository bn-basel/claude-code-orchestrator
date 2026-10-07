# Changelog

Each version lists what changed and the lesson behind it. The workflow has been used day to day on a live
production app, so most entries come from something that went wrong or cost too much.

## v1.2 · 2026-10-07 · first public template

**Added**
- **`scout` helper** (Sonnet, medium effort, read-only). Simple lookups ("where is X", "what does Y receive") were
  going to full reviewers. Now they go to a cheap helper that answers one question with file:line evidence.
  Reviewers are only for plan and code reviews. Seven helpers in total.
- The template itself: product details replaced by placeholders, plus an install prompt that backs up, audits,
  adapts and installs one approved step at a time.

**Changed**
- **The owner decides only four kinds of thing:** wording users see, product behaviour, production/money/privacy,
  and scope. The orchestrator decides everything else, logs it, and gives it one line in its summary. Far fewer
  interruptions, with nothing important slipping through.
- **Every decision starts with a concrete scenario** (what happens today, what changes, an example), then the
  recommendation first. Abstract options were hard to judge.
- **Each code review asks whether the change makes the architecture map untrue.** If so, the map update ships in
  the same PR, so the map never drifts.

**Lessons**
- New tests are judged against `origin/main`, **also in a fix round**. Judging against the helper's own earlier
  commit let a test that proved nothing slip through.
- A task that touches shared test setup runs the whole affected suite. Shared fixtures broke unrelated tests.
- "Done" means **the** production path uses it, not **a** production path. A new write path skipped a guard the
  old one had.
- Never print HTTP error bodies or headers: one leaked an API key into a transcript.
- A command that waits for input, given none, hung in the background for 1.5 hours.
- Run git as `cd <dir> && git …`, not `git -C <dir> …`: allow rules match the start of a command, so the `-C`
  form caused needless pop-ups.
- Confirm a deploy from GitHub statuses. A health endpoint couldn't show which version was live.
- A migration edited after it was applied (for example by a review fix) must be applied again before the merge.
  Drift checks can't catch it afterwards.

## v1.1 · October 2026

**Lessons**
- Feature branches are created with `--no-track`. Without it, a branch made from `origin/main` tracks main, so a
  plain `git push` aims at main.
- **Ask rules don't stop helpers from starting** (seen in accept-edits mode; auto mode doesn't either). So the gate for the adversarial
  (Fable) reviewer is a written rule plus a log entry with the date and the owner's yes.
- Each helper costs about 20k tokens just to start, so very small tasks are grouped into one brief.
- To prove old wording is gone, search for its one distinctive word. A whole-phrase search misses text split
  across a line break.
- No AI attribution lines in commits or PRs (set in `settings.json`).

## v1.0 · October 2026

- Installed the playbook, six helpers, safety settings and branch protection with an empty bypass list.
- Moved production secrets out of the project, with a rotation list for keys agents could have seen.
- Shipped the first feature through the full loop.
