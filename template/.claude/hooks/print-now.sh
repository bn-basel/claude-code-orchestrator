#!/usr/bin/env bash
# SessionStart hook, macOS / Linux.
# Runs when a session starts, resumes or is cleared, and right after the conversation is compacted.
# Whatever it prints is added to the session's context, so the orchestrator always begins from the
# "Now" section of PLAN.md.

# Claude Code sends a small JSON object on stdin; "source" says why the hook ran.
# (Read stdin only when something is piped in, so running the script by hand never hangs.)
source=""
if [ ! -t 0 ]; then
  input="$(cat)"
  source="$(printf '%s' "$input" | sed -n 's/.*"source"[[:space:]]*:[[:space:]]*"\([a-z]*\)".*/\1/p')"
fi

plan="${CLAUDE_PROJECT_DIR:-.}/PLAN.md"

if [ "$source" = "compact" ]; then
  echo "The conversation was just compacted. Before doing anything else, re-read ORCHESTRATOR.md."
else
  echo "If you are the orchestrator: read ORCHESTRATOR.md before your first reply, then report where we are, what is next and anything blocking, in 3 lines or fewer."
fi
echo "Current state, from PLAN.md:"
echo

if [ -f "$plan" ]; then
  # Print from "## Now" up to (not including) the next "## " heading.
  awk '/^## Now[[:space:]]*$/ { on = 1; print; next } /^## / { on = 0 } on' "$plan"
else
  echo "(PLAN.md not found at $plan. Ask the owner where things stand.)"
fi

exit 0
