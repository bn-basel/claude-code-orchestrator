#!/usr/bin/env bash
# SessionStart hook, macOS / Linux.
# Runs when a session starts, resumes or is cleared, and right after the conversation is compacted.
# Whatever it prints is added to the session's context, so the orchestrator always begins from the
# "Now" section of PLAN.md. After a compaction it also counts compactions for this session.

# Claude Code sends a small JSON object on stdin; "source" says why the hook ran.
# (Read stdin only when something is piped in, so running the script by hand never hangs.)
source=""
session=""
if [ ! -t 0 ]; then
  input="$(cat)"
  source="$(printf '%s' "$input" | sed -n 's/.*"source"[[:space:]]*:[[:space:]]*"\([a-z]*\)".*/\1/p')"
  session="$(printf '%s' "$input" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([A-Za-z0-9_-]*\)".*/\1/p')"
fi

root="${CLAUDE_PROJECT_DIR:-.}"
plan="$root/PLAN.md"

if [ "$source" = "compact" ]; then
  echo "The conversation was just compacted. Before doing anything else, re-read ORCHESTRATOR.md."
  # Count compactions per session in .claude/state/compactions-<session>.txt (gitignored).
  if [ -n "$session" ]; then
    dir="$root/.claude/state"
    file="$dir/compactions-$session.txt"
    count=1
    mkdir -p "$dir" 2>/dev/null
    if [ -f "$file" ]; then
      prev="$(head -n 1 "$file" | tr -cd '0-9')"
      count=$(( ${prev:-0} + 1 ))
    fi
    printf '%s\n' "$count" > "$file" 2>/dev/null
    echo "Compaction $count in this session."
    if [ "$count" -ge 3 ]; then
      echo 'That is 3 or more: update Now, commit PLAN.md, and tell the owner to start a fresh session with "Continue from Now." (ORCHESTRATOR.md section 8).'
    fi
  fi
else
  echo "If you are the orchestrator: read ORCHESTRATOR.md before your first reply, and make that reply the Session start shape (where we are, next, blocking)."
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
