#!/usr/bin/env bash
# PreToolUse hook on helper launches (the Agent tool), macOS / Linux.
# Checks every launch against .claude/model-policy.md: which models each helper may use, effort up to xhigh, and
# which launches need the owner's yes. Built-in helpers and unknown names are blocked.
#   allow: exit 0, no output (the normal permission rules still apply)
#   ask:   exit 0 with a JSON "ask" decision; Claude Code shows the owner a pop-up with the reason
#   block: exit 2; Claude sees the message on stderr and can retry correctly
# Check mode (--check [--root <folder>]) tests every .claude/agents/*.md against the same table; exit 1 lists problems.
# JSON is read with Perl's built-in JSON::PP, which ships with macOS, Linux and Git for Windows (no jq needed).

check=0
for arg in "$@"; do [ "$arg" = "--check" ] && check=1; done

if ! command -v perl >/dev/null 2>&1; then
  if [ "$check" = 1 ]; then echo "FAIL: perl not found; the guard needs it"; exit 1; fi
  echo "Blocked by the helper guard: perl not found, so the launch could not be checked." >&2
  exit 2
fi

# Read the launch only when something is piped in, so running the check by hand never hangs.
GUARD_INPUT=""
if [ "$check" = 0 ] && [ ! -t 0 ]; then GUARD_INPUT="$(cat)"; fi
export GUARD_INPUT

perl - "$@" <<'PERL'
use strict;
use warnings;
use JSON::PP;

my @families = qw(haiku sonnet opus fable);
my %effort_ok = map { $_ => 1 } qw(low medium high xhigh);

my ($check, $root) = (0, undef);
for (my $i = 0; $i < @ARGV; $i++) {
  $check = 1 if $ARGV[$i] eq '--check';
  $root = $ARGV[$i + 1] if $ARGV[$i] eq '--root';
}
$root = $ENV{CLAUDE_PROJECT_DIR} || '.' unless defined $root && length $root;
my $policy_file = "$root/.claude/model-policy.md";
my $agents_dir = "$root/.claude/agents";

sub trim { my $s = shift // ''; $s =~ s/^\s+|\s+$//g; return $s }

# "claude-haiku-5-5" -> "haiku"; anything else comes back lower-cased.
sub family {
  my $m = lc trim(shift);
  return '' if $m eq '';
  for my $f (@families) { return $f if index($m, $f) >= 0 }
  return $m;
}

# Rows of the policy table, keyed by helper name (exact case).
sub read_policy {
  open(my $fh, '<:encoding(UTF-8)', $policy_file) or return undef;
  my %rows;
  while (my $line = <$fh>) {
    $line =~ s/\r?\n$//;
    next unless $line =~ /^\s*\|/;
    $line = trim($line);
    $line =~ s/^\|//;
    $line =~ s/\|$//;
    my @c = map { my $x = $_; $x =~ s/`//g; trim($x) } split /\|/, $line, -1;
    next if @c < 3;
    my $name = $c[0];
    next if $name eq 'Helper' || $name =~ /^[-: ]+$/;
    my $builtin = 0;
    if ($name =~ /^(.+?)\s*\(built-in\)$/) { $name = $1; $builtin = 1 }
    my $ask = lc $c[2];
    $rows{$name} = {
      name       => $name,
      builtin    => $builtin,
      allowed    => [ grep { length } map { family($_) } split /,/, $c[1] ],
      ask_all    => ($ask =~ /every run/ ? 1 : 0),
      ask_models => [ grep { index($ask, $_) >= 0 } @families ],
    };
  }
  close $fh;
  return \%rows;
}

# The key: value lines between the two --- lines at the top of an agent file.
sub frontmatter {
  my $path = shift;
  my %fm;
  open(my $fh, '<:encoding(UTF-8)', $path) or return \%fm;
  my $first = <$fh>;
  return \%fm unless defined $first && $first =~ /^---\s*$/;
  while (my $l = <$fh>) {
    $l =~ s/\r?\n$//;
    last if $l =~ /^---\s*$/;
    if ($l =~ /^([A-Za-z][\w-]*):\s*(.*)$/) {
      my ($k, $v) = ($1, trim($2));
      $v =~ s/^["']+|["']+$//g;
      $fm{$k} = $v;
    }
  }
  close $fh;
  return \%fm;
}

sub agent_files {
  opendir(my $d, $agents_dir) or return ();
  my @f = map { "$agents_dir/$_" } sort grep { /\.md$/ } readdir $d;
  closedir $d;
  return @f;
}

# ---------- Check mode ----------
if ($check) {
  unless (-f $policy_file) { print "FAIL: no policy table at $policy_file\n"; exit 1 }
  my $policy = read_policy();
  unless ($policy && %$policy) { print "FAIL: no rows in $policy_file\n"; exit 1 }
  my (@problems, %seen);
  for my $file (agent_files()) {
    my $fm = frontmatter($file);
    (my $label = $file) =~ s{.*/}{};
    my $name = $fm->{name} // '';
    if ($name eq '') { push @problems, "$label: no name"; next }
    $seen{$name} = 1;
    my $row = $policy->{$name};
    unless ($row) { push @problems, "$label: helper '$name' has no row in model-policy.md"; next }
    my $allowed_text = join ' or ', @{ $row->{allowed} };
    my $model = family($fm->{model});
    if ($model eq '' || $model eq 'inherit') {
      push @problems, "$label: no model (it would run on the main session's model); allowed: $allowed_text";
    } elsif (!grep { $_ eq $model } @{ $row->{allowed} }) {
      push @problems, "$label: model '$fm->{model}' not allowed; allowed: $allowed_text";
    }
    my $effort = $fm->{effort} // '';
    if ($effort ne '' && !$effort_ok{ lc $effort }) {
      push @problems, "$label: effort '$effort' not allowed in an agent file; up to xhigh";
    }
  }
  for my $row (values %$policy) {
    push @problems, "model-policy.md: '$row->{name}' has a row but no agent file" if !$row->{builtin} && !$seen{ $row->{name} };
  }
  if (@problems) { print "FAIL: $_\n" for @problems; exit 1 }
  printf "OK: %d agent files match model-policy.md (%d rows)\n", scalar(keys %seen), scalar(keys %$policy);
  exit 0;
}

# ---------- Hook mode ----------
sub block {
  print STDERR "Blocked by the helper guard (.claude/model-policy.md): $_[0]\n";
  exit 2;
}

sub ask {
  print JSON::PP->new->canonical->encode({ hookSpecificOutput => {
    hookEventName            => 'PreToolUse',
    permissionDecision       => 'ask',
    permissionDecisionReason => $_[0],
  } }), "\n";
  exit 0;
}

my $raw = $ENV{GUARD_INPUT} // '';
block('the launch arrived empty, so it could not be checked.') if trim($raw) eq '';
my $data = eval { JSON::PP->new->utf8(0)->decode($raw) };
block('the launch could not be read, so it could not be checked.') unless ref $data eq 'HASH';

my $tool = $data->{tool_name} // '';
exit 0 unless $tool eq 'Agent' || $tool eq 'Task';
my $in = ref $data->{tool_input} eq 'HASH' ? $data->{tool_input} : {};
sub field { my $v = $in->{ $_[0] }; return defined $v && !ref $v ? "$v" : '' }

block("no policy table at $policy_file.") unless -f $policy_file;
my $policy = read_policy();
block('the policy table could not be read.') unless $policy;
block('the policy table has no rows.') unless %$policy;

my $type = field('subagent_type');
$type = 'general-purpose' if $type eq '';
my $row = $policy->{$type};
unless ($row) {
  my $names = join ', ', sort { lc($a) cmp lc($b) } keys %$policy;
  block("'$type' is not an allowed helper. Allowed: $names. Claude's built-in helpers are blocked unless the table lists them.");
}

# The helper's agent file, if it has one (built-in helpers don't).
my $fm = {};
for my $file (agent_files()) {
  my $candidate = frontmatter($file);
  if (($candidate->{name} // '') eq $type) { $fm = $candidate; last }
}
block("no agent file for '$type' in .claude/agents/.") if !$row->{builtin} && !defined $fm->{name};

# Effective model, highest priority first: a forced env model, the launch, the agent file, the env default.
my @allowed = @{ $row->{allowed} };
my $allowed_text = join ' or ', @allowed;
my $force = $ENV{CLAUDE_CODE_SUBAGENT_MODEL_FORCE} // '';
my $env_model = $ENV{CLAUDE_CODE_SUBAGENT_MODEL} // '';
my ($model, $source) = ('', '');
if ($force ne '' && $force ne '0' && $env_model ne '') { ($model, $source) = ($env_model, 'CLAUDE_CODE_SUBAGENT_MODEL (forced)') }
elsif (field('model') ne '') { ($model, $source) = (field('model'), 'the launch') }
elsif (($fm->{model} // '') ne '') { ($model, $source) = ($fm->{model}, 'its agent file') }
elsif ($env_model ne '') { ($model, $source) = ($env_model, 'CLAUDE_CODE_SUBAGENT_MODEL') }
my $fam = family($model);

if ($fam eq '' || $fam eq 'inherit') {
  block("'$type' needs a model named in the launch (model: $allowed[0]). Without one it would run on the main session's model. Allowed: $allowed_text.");
}
unless (grep { $_ eq $fam } @allowed) {
  my $retry = "Retry with model: $allowed[0]";
  $retry .= ', or leave model out to use its agent file' unless $row->{builtin};
  block("'$type' may use $allowed_text only ($source asked for $model). Effort up to xhigh. $retry.");
}

# Effective effort: the env var outranks the launch, which outranks the agent file.
my ($effort, $effort_source) = ('', '');
my $env_effort = $ENV{CLAUDE_CODE_EFFORT_LEVEL} // '';
if ($env_effort ne '') { ($effort, $effort_source) = (lc $env_effort, 'CLAUDE_CODE_EFFORT_LEVEL') }
elsif (field('effort') ne '') { ($effort, $effort_source) = (lc field('effort'), 'the launch') }
elsif (($fm->{effort} // '') ne '') { ($effort, $effort_source) = (lc $fm->{effort}, 'its agent file') }

my @reasons;
if ($effort eq 'max') {
  if ($effort_source ne 'the launch') {
    block("$effort_source sets effort max, which would apply without asking. Use up to xhigh there; max is asked for per launch, with the owner's yes.");
  }
  push @reasons, "effort max for '$type'";
} elsif ($effort ne '' && !$effort_ok{$effort}) {
  block("effort '$effort' (from $effort_source) isn't allowed. Use low, medium, high or xhigh; max needs the owner's yes.");
}
push @reasons, "every '$type' run" if $row->{ask_all};
push @reasons, "'$type' on $fam" if grep { $_ eq $fam } @{ $row->{ask_models} };

if (@reasons) {
  ask("The owner's yes is needed for: " . join('; ', @reasons) . '. Approve only if you already agreed to this in chat.');
}
exit 0;
PERL
