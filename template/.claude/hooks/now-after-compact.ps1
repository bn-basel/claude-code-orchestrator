# SessionStart hook (matcher: compact), Windows PowerShell.
# Runs right after the conversation is compacted. Whatever it prints is added to the new context,
# so the orchestrator gets its current state back: the "Now" section of PLAN.md.

$root = if ($env:CLAUDE_PROJECT_DIR) { $env:CLAUDE_PROJECT_DIR } else { (Get-Location).Path }
$plan = Join-Path $root 'PLAN.md'

Write-Output 'The conversation was just compacted. Before doing anything else, re-read ORCHESTRATOR.md.'
Write-Output 'Current state, from PLAN.md:'
Write-Output ''

if (Test-Path -LiteralPath $plan) {
    # Print from "## Now" up to (not including) the next "## " heading.
    $on = $false
    foreach ($line in Get-Content -LiteralPath $plan -Encoding UTF8) {
        if ($line -match '^## Now\s*$') { $on = $true; Write-Output $line; continue }
        if ($line -match '^## ') { $on = $false }
        if ($on) { Write-Output $line }
    }
} else {
    Write-Output "(PLAN.md not found at $plan. Ask the owner where things stand.)"
}

exit 0
