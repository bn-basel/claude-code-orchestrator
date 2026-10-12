# SessionStart hook, Windows PowerShell.
# Runs when a session starts, resumes or is cleared, and right after the conversation is compacted.
# Whatever it prints is added to the session's context, so the orchestrator always begins from the
# "Now" section of PLAN.md.

# Print UTF-8, so the dots and dashes in PLAN.md arrive intact (Windows PowerShell defaults to the console code page).
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false

# Claude Code sends a small JSON object on stdin; "source" says why the hook ran.
$source = ''
if ([Console]::IsInputRedirected) {
    $raw = [Console]::In.ReadToEnd()
    if ($raw) { try { $source = ($raw | ConvertFrom-Json).source } catch { $source = '' } }
}

$root = if ($env:CLAUDE_PROJECT_DIR) { $env:CLAUDE_PROJECT_DIR } else { (Get-Location).Path }
$plan = Join-Path $root 'PLAN.md'

if ($source -eq 'compact') {
    Write-Output 'The conversation was just compacted. Before doing anything else, re-read ORCHESTRATOR.md.'
} else {
    Write-Output 'If you are the orchestrator: read ORCHESTRATOR.md before your first reply, then report where we are, what is next and anything blocking, in 3 lines or fewer.'
}
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
