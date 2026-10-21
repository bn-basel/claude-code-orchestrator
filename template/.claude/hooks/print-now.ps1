# SessionStart hook, Windows PowerShell.
# Runs when a session starts, resumes or is cleared, and right after the conversation is compacted.
# Whatever it prints is added to the session's context, so the orchestrator always begins from the
# "Now" section of PLAN.md. After a compaction it also counts compactions for this session.

# Print UTF-8, so the dots and dashes in PLAN.md arrive intact (Windows PowerShell defaults to the console code page).
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false

# Claude Code sends a small JSON object on stdin; "source" says why the hook ran.
$source = ''
$session = ''
if ([Console]::IsInputRedirected) {
    $raw = [Console]::In.ReadToEnd()
    if ($raw) {
        try { $data = $raw | ConvertFrom-Json; $source = $data.source; $session = $data.session_id } catch { $source = '' }
    }
}

$root = if ($env:CLAUDE_PROJECT_DIR) { $env:CLAUDE_PROJECT_DIR } else { (Get-Location).Path }
$plan = Join-Path $root 'PLAN.md'

if ($source -eq 'compact') {
    Write-Output 'The conversation was just compacted. Before doing anything else, re-read ORCHESTRATOR.md.'
    # Count compactions per session in .claude/state/compactions-<session>.txt (gitignored).
    if ($session -match '^[A-Za-z0-9_-]+$') {
        $count = 1
        try {
            $dir = Join-Path $root '.claude/state'
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
            $file = Join-Path $dir "compactions-$session.txt"
            if (Test-Path -LiteralPath $file) { $count = [int](Get-Content -LiteralPath $file -TotalCount 1) + 1 }
            Set-Content -LiteralPath $file -Value $count -Encoding ASCII
        } catch { }
        Write-Output "Compaction $count in this session."
        if ($count -ge 3) {
            Write-Output 'That is 3 or more: update Now, commit PLAN.md, and tell the owner to start a fresh session with "Continue from Now." (ORCHESTRATOR.md section 8).'
        }
    }
} else {
    Write-Output 'If you are the orchestrator: read ORCHESTRATOR.md before your first reply, and make that reply the Session start shape (where we are, next, blocking).'
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
