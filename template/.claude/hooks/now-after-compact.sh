#!/usr/bin/env bash
# SessionStart hook (matcher: compact), macOS / Linux.
# Runs right after the conversation is compacted. Whatever it prints is added to the new context,
# so the orchestrator gets its current state back: the "Now" section of PLAN.md.

plan="${CLAUDE_PROJECT_DIR:-.}/PLAN.md"

echo "The conversation was just compacted. Before doing anything else, re-read ORCHESTRATOR.md."
echo "Current state, from PLAN.md:"
echo

if [ -f "$plan" ]; then
  # Print from "## Now" up to (not including) the next "## " heading.
  awk '/^## Now[[:space:]]*$/ { on = 1; print; next } /^## / { on = 0 } on' "$plan"
else
  echo "(PLAN.md not found at $plan. Ask the owner where things stand.)"
fi

exit 0
