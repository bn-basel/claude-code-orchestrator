# Code rules: {{PROJECT_NAME}}

<!-- This file lives in the code repo. Helpers read it before every task. Keep it short and factual. -->

## Sources of truth

- **Schema:** <!-- ADAPT: where the real schema lives, e.g. the migrations folder -->.
- **Architecture:** `docs/ARCHITECTURE.md`, if it exists. Writing it is a good first wide feature.
- **External API facts:** <!-- ADAPT: where verified API details live -->. Never invent endpoint fields or payload shapes. If a detail isn't documented, say so instead of guessing.

## Fixed rules

- The stack is fixed. Never add frameworks, libraries, services or packages without {{OWNER}}'s approval.
- Database changes are migrations, **add-only**: add tables and columns; renaming or deleting happens later, separately. **Never apply a migration**; {{OWNER}} does that.
- Secrets come only from environment variables. Locally there are **no production secrets**: the database is local and outside services run on fakes or test keys.
- Customer-facing text lives in <!-- ADAPT: the strings file or translation folder -->, never inline in logic.
<!-- ADAPT: anything that must hold for every change, e.g. "every webhook handler is idempotent". -->

## Feature switches

<!-- ADAPT: keep this section if the project has feature switches (flags); otherwise delete it. -->
- A change to switches changes **one switch per action**. Never send the whole set: the server should refuse an update
  that replaces every switch at once, so a stale copy can't silently switch others back.
- Every switch change is logged: which switch, old → new value, who, when.

## Product rules (don't break these)

<!-- ADAPT: the rules a reviewer must enforce, one line each. Examples:
- A user can only ever see their own organisation's data.
- New customer-facing features get a feature switch and start off.
-->

## Tests

- Behaviour-defining work gets **tests first**.
- **Screens:** behaviour on a screen is proven by scripted end-to-end tests (e.g. Playwright) that run in CI.
  Screenshots from `ui-tester` are evidence for the PR, never a substitute for those tests.
- **New tests must fail on `origin/{{MAIN_BRANCH}}`.** The orchestrator checks this. Helpers report the names of the tests they added.
- **Mutation walls** for wide and closed work: break the guard on purpose, and the test that protects it must go red.
- **Nothing is done until a real production path uses it.** A test calling it isn't enough. When you build a new write path for existing data, re-check every guard that protected the old one.
- **Two lists that must agree**, where only one fails loudly: add a test that compares them.

**Commands** (from `_worktrees/build`):

- **One test file:** `{{TEST_COMMAND}} <test file>`. Run targeted tests per task.
- **Full suite:** `{{FULL_TEST_COMMAND}}`. Once, before the PR.
- **Type check / lint:** `{{CHECK_COMMAND}}`.
<!-- ADAPT: database tests, if any: how to start a throwaway local database and point the tests at it. Never a shared or production one. -->

**Known flaky tests.** If only these fail, re-run them once and mention it in your report. **Don't "fix" them** unless the task says so.

- <!-- ADAPT: test name (why it flakes), or "none known" -->
