# PreToolUse hook on helper launches (the Agent tool), Windows PowerShell.
# Checks every launch against .claude/model-policy.md: which models each helper may use, effort up to xhigh, and
# which launches need the owner's yes. Built-in helpers and unknown names are blocked.
#   allow: exit 0, no output (the normal permission rules still apply)
#   ask:   exit 0 with a JSON "ask" decision; Claude Code shows the owner a pop-up with the reason
#   block: exit 2; Claude sees the message on stderr and can retry correctly
# Check mode (-Check [-Root <folder>]) tests every .claude/agents/*.md against the same table; exit 1 lists problems.
param([switch]$Check, [string]$Root)

$families = @('haiku', 'sonnet', 'opus', 'fable')
$efforts = @('low', 'medium', 'high', 'xhigh')

if (-not $Root) { $Root = if ($env:CLAUDE_PROJECT_DIR) { $env:CLAUDE_PROJECT_DIR } else { (Get-Location).Path } }
$policyFile = Join-Path $Root '.claude/model-policy.md'
$agentsDir = Join-Path $Root '.claude/agents'

# "claude-haiku-5-5" -> "haiku"; anything else comes back lower-cased.
function Get-Family([string]$model) {
    if (-not $model) { return '' }
    $m = $model.Trim().ToLowerInvariant()
    foreach ($f in $families) { if ($m.Contains($f)) { return $f } }
    return $m
}

# Rows of the policy table, keyed by helper name (exact case).
function Read-Policy {
    $rows = New-Object System.Collections.Hashtable ([StringComparer]::Ordinal)
    foreach ($line in Get-Content -LiteralPath $policyFile -Encoding UTF8) {
        if ($line -notmatch '^\s*\|') { continue }
        $cells = @($line.Trim().Trim('|').Split('|') | ForEach-Object { ($_ -replace '`', '').Trim() })
        if ($cells.Count -lt 3) { continue }
        $name = $cells[0]
        if ($name -eq 'Helper' -or $name -match '^[-: ]+$') { continue }
        $builtin = $false
        if ($name -match '^(.+?)\s*\(built-in\)$') { $name = $Matches[1]; $builtin = $true }
        $askText = $cells[2].ToLowerInvariant()
        $rows[$name] = [pscustomobject]@{
            Name      = $name
            Builtin   = $builtin
            Allowed   = @($cells[1].Split(',') | ForEach-Object { Get-Family $_ } | Where-Object { $_ })
            AskAll    = ($askText -match 'every run')
            AskModels = @($families | Where-Object { $askText.Contains($_) })
        }
    }
    return $rows
}

# The key: value lines between the two --- lines at the top of an agent file.
function Read-Frontmatter([string]$path) {
    $fm = @{}
    $lines = @(Get-Content -LiteralPath $path -Encoding UTF8)
    if ($lines.Count -lt 2 -or $lines[0].Trim() -ne '---') { return $fm }
    for ($i = 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i].Trim() -eq '---') { break }
        if ($lines[$i] -match '^([A-Za-z][\w-]*):\s*(.*)$') { $fm[$Matches[1]] = $Matches[2].Trim().Trim('"', "'") }
    }
    return $fm
}

function Get-AgentFiles {
    if (-not (Test-Path -LiteralPath $agentsDir)) { return @() }
    return @(Get-ChildItem -LiteralPath $agentsDir -Filter '*.md' | Sort-Object Name)
}

# ---------- Check mode ----------
if ($Check) {
    if (-not (Test-Path -LiteralPath $policyFile)) { Write-Output "FAIL: no policy table at $policyFile"; exit 1 }
    $policy = Read-Policy
    if ($policy.Count -eq 0) { Write-Output "FAIL: no rows in $policyFile"; exit 1 }
    $problems = New-Object System.Collections.Generic.List[string]
    $seen = @{}
    foreach ($file in Get-AgentFiles) {
        $fm = Read-Frontmatter $file.FullName
        $label = $file.Name
        $name = $fm['name']
        if (-not $name) { $problems.Add("${label}: no name"); continue }
        $seen[$name] = $true
        $row = $policy[$name]
        if (-not $row) { $problems.Add("${label}: helper '$name' has no row in model-policy.md"); continue }
        $allowedText = $row.Allowed -join ' or '
        $model = Get-Family $fm['model']
        if (-not $model -or $model -eq 'inherit') {
            $problems.Add("${label}: no model (it would run on the main session's model); allowed: $allowedText")
        } elseif ($row.Allowed -notcontains $model) {
            $problems.Add("${label}: model '$($fm['model'])' not allowed; allowed: $allowedText")
        }
        $effort = $fm['effort']
        if ($effort -and $efforts -notcontains $effort.ToLowerInvariant()) {
            $problems.Add("${label}: effort '$effort' not allowed in an agent file; up to xhigh")
        }
    }
    foreach ($row in $policy.Values) {
        if (-not $row.Builtin -and -not $seen[$row.Name]) { $problems.Add("model-policy.md: '$($row.Name)' has a row but no agent file") }
    }
    if ($problems.Count -gt 0) {
        foreach ($p in $problems) { Write-Output "FAIL: $p" }
        exit 1
    }
    Write-Output "OK: $($seen.Count) agent files match model-policy.md ($($policy.Count) rows)"
    exit 0
}

# ---------- Hook mode ----------
function Block([string]$message) {
    [Console]::Error.WriteLine("Blocked by the helper guard (.claude/model-policy.md): $message")
    exit 2
}

function Ask([string]$message) {
    $out = @{ hookSpecificOutput = @{
            hookEventName            = 'PreToolUse'
            permissionDecision       = 'ask'
            permissionDecisionReason = $message
        } }
    Write-Output ($out | ConvertTo-Json -Compress -Depth 4)
    exit 0
}

try {
    $raw = if ([Console]::IsInputRedirected) { [Console]::In.ReadToEnd() } else { '' }
    if (-not $raw.Trim()) { Block 'the launch arrived empty, so it could not be checked.' }
    $data = $raw | ConvertFrom-Json
} catch {
    Block 'the launch could not be read, so it could not be checked.'
}

if ($data.tool_name -ne 'Agent' -and $data.tool_name -ne 'Task') { exit 0 }
$in = $data.tool_input

if (-not (Test-Path -LiteralPath $policyFile)) { Block "no policy table at $policyFile." }
try { $policy = Read-Policy } catch { Block 'the policy table could not be read.' }
if ($policy.Count -eq 0) { Block 'the policy table has no rows.' }

$type = [string]$in.subagent_type
if (-not $type) { $type = 'general-purpose' }
$row = $policy[$type]
if (-not $row) {
    $names = ($policy.Keys | Sort-Object) -join ', '
    Block "'$type' is not an allowed helper. Allowed: $names. Claude's built-in helpers are blocked unless the table lists them."
}

# The helper's agent file, if it has one (built-in helpers don't).
$fm = @{}
foreach ($file in Get-AgentFiles) {
    $candidate = Read-Frontmatter $file.FullName
    if ($candidate['name'] -ceq $type) { $fm = $candidate; break }
}
if (-not $row.Builtin -and -not $fm['name']) { Block "no agent file for '$type' in .claude/agents/." }

# Effective model, highest priority first: a forced env model, the launch, the agent file, the env default.
$allowedText = $row.Allowed -join ' or '
$forced = $env:CLAUDE_CODE_SUBAGENT_MODEL_FORCE -and $env:CLAUDE_CODE_SUBAGENT_MODEL_FORCE -ne '0' -and $env:CLAUDE_CODE_SUBAGENT_MODEL
if ($forced) { $model = $env:CLAUDE_CODE_SUBAGENT_MODEL; $source = 'CLAUDE_CODE_SUBAGENT_MODEL (forced)' }
elseif ([string]$in.model) { $model = [string]$in.model; $source = 'the launch' }
elseif ($fm['model']) { $model = $fm['model']; $source = 'its agent file' }
elseif ($env:CLAUDE_CODE_SUBAGENT_MODEL) { $model = $env:CLAUDE_CODE_SUBAGENT_MODEL; $source = 'CLAUDE_CODE_SUBAGENT_MODEL' }
else { $model = ''; $source = '' }
$family = Get-Family $model

if (-not $family -or $family -eq 'inherit') {
    Block "'$type' needs a model named in the launch (model: $($row.Allowed[0])). Without one it would run on the main session's model. Allowed: $allowedText."
}
if ($row.Allowed -notcontains $family) {
    $retry = "Retry with model: $($row.Allowed[0])"
    if (-not $row.Builtin) { $retry += ', or leave model out to use its agent file' }
    Block "'$type' may use $allowedText only ($source asked for $model). Effort up to xhigh. $retry."
}

# Effective effort: the env var outranks the launch, which outranks the agent file.
$envEffort = [string]$env:CLAUDE_CODE_EFFORT_LEVEL
if ($envEffort) { $effort = $envEffort.ToLowerInvariant(); $effortSource = 'CLAUDE_CODE_EFFORT_LEVEL' }
elseif ([string]$in.effort) { $effort = ([string]$in.effort).ToLowerInvariant(); $effortSource = 'the launch' }
elseif ($fm['effort']) { $effort = $fm['effort'].ToLowerInvariant(); $effortSource = 'its agent file' }
else { $effort = ''; $effortSource = '' }

$reasons = New-Object System.Collections.Generic.List[string]
if ($effort -eq 'max') {
    if ($effortSource -ne 'the launch') {
        Block "$effortSource sets effort max, which would apply without asking. Use up to xhigh there; max is asked for per launch, with the owner's yes."
    }
    $reasons.Add("effort max for '$type'")
} elseif ($effort -and $efforts -notcontains $effort) {
    Block "effort '$effort' (from $effortSource) isn't allowed. Use low, medium, high or xhigh; max needs the owner's yes."
}
if ($row.AskAll) { $reasons.Add("every '$type' run") }
if ($row.AskModels -contains $family) { $reasons.Add("'$type' on $family") }

if ($reasons.Count -gt 0) {
    Ask ("The owner's yes is needed for: " + ($reasons -join '; ') + '. Approve only if you already agreed to this in chat.')
}
exit 0
