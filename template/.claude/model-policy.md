# Model policy

The one place that says which models each helper may use. The guard hook (`hooks/guard-helpers.*`) reads this table
before every helper launch, and its check mode tests every agent file against it. Change a row here, never in the
scripts. Each helper's **default** model and effort live in its agent file; this table says what's **allowed**.

| Helper | Models allowed | {{OWNER}}'s yes needed for |
|---|---|---|
| scout | haiku | — |
| ui-tester | haiku | — |
| implementer | sonnet | — |
| test-writer | sonnet | — |
| implementer-wide | sonnet, opus | opus |
| reviewer | opus | — |
| reviewer-light | opus | — |
| adversarial-reviewer | fable | every run |

- **Effort:** up to `xhigh` for every helper. `max` needs {{OWNER}}'s yes.
- **{{OWNER}}'s yes** means both: ask in chat first, with the reason, and then {{OWNER}} approves the pop-up the guard
  shows at launch.
- **Models:** a full model ID counts as its family (`claude-haiku-5-5` is `haiku`). A helper with no model in the launch
  and none in its agent file is blocked: it would run on the main session's model.
- **Not in the table** (Claude's built-in helpers, any other name): blocked. To allow a built-in helper, add a row
  named like `Explore (built-in)`.
