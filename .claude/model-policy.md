# Model policy (this repo)

Sessions that work on the template follow the same limits as the template itself. This repo has no helpers of its own,
so only two of Claude's read-only built-in helpers are allowed, for research, with a cheap model **named in the
launch**. The guard is the template's own script (`template/.claude/hooks/guard-helpers.*`), so this repo tests it on
every launch.

| Helper | Models allowed | Owner's yes needed for |
|---|---|---|
| Explore (built-in) | sonnet, haiku | — |
| claude-code-guide (built-in) | sonnet, haiku | — |

- **Effort:** up to `xhigh`. `max` needs the owner's yes: ask in chat first, then the pop-up.
- **Not in the table:** blocked (every other built-in helper, and any custom one).
