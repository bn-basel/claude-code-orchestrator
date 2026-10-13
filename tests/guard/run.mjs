// Runs every case in cases.json through both versions of the helper guard (PowerShell and bash) and prints a table.
// Usage: node tests/guard/run.mjs   (from the repo root; Node 18+, no packages)
// Exit 0 = every case gave the expected result in every version that could run; 1 = at least one didn't.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..', '..');
const hooks = join(repo, 'template', '.claude', 'hooks');
const roots = { template: join(repo, 'template'), repo, broken: join(here, 'fixtures', 'broken') };
const cases = JSON.parse(readFileSync(join(here, 'cases.json'), 'utf8'));

// Env vars that change the guard's answer; cleared for every case unless the case sets them.
const guardEnv = ['CLAUDE_CODE_EFFORT_LEVEL', 'CLAUDE_CODE_SUBAGENT_MODEL', 'CLAUDE_CODE_SUBAGENT_MODEL_FORCE'];

function findBash() {
  if (process.platform !== 'win32') return 'bash';
  // On Windows, use Git's bash (System32\bash.exe would be WSL, with a different filesystem).
  const where = spawnSync('where', ['git'], { encoding: 'utf8' });
  for (const line of (where.stdout || '').split(/\r?\n/).filter(Boolean)) {
    const bash = join(dirname(dirname(line.trim())), 'bin', 'bash.exe');
    if (existsSync(bash)) return bash;
  }
  return null;
}

function findPowerShell() {
  if (process.platform === 'win32') return 'powershell.exe';
  return spawnSync('pwsh', ['-v'], { encoding: 'utf8' }).status === 0 ? 'pwsh' : null;
}

const versions = [];
const ps = findPowerShell();
if (ps) versions.push({ label: 'ps1', run: (args) => [ps, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(hooks, 'guard-helpers.ps1'), ...args]] });
const bash = findBash();
if (bash) versions.push({ label: 'sh', run: (args) => [bash, [join(hooks, 'guard-helpers.sh').replaceAll('\\', '/'), ...args]] });

function run(version, args, { root, env = {}, input = '' }) {
  const fullEnv = { ...process.env, CLAUDE_PROJECT_DIR: root, ...env };
  for (const k of guardEnv) if (!(k in env)) delete fullEnv[k];
  const [cmd, argv] = version.run(args);
  const r = spawnSync(cmd, argv, { input, env: fullEnv, encoding: 'utf8', timeout: 30000 });
  return { code: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

function hookResult({ code, out, err }) {
  if (code === 2) return { result: 'deny', message: err };
  if (code === 0 && out === '') return { result: 'allow', message: '' };
  if (code === 0) {
    try {
      const o = JSON.parse(out).hookSpecificOutput;
      if (o?.permissionDecision === 'ask') return { result: 'ask', message: o.permissionDecisionReason };
    } catch { /* fall through */ }
  }
  return { result: `error (exit ${code})`, message: err || out };
}

const rows = [];
let failed = 0;

for (const c of cases.hook) {
  const input = c.raw ?? JSON.stringify(c.input);
  for (const v of versions) {
    const { result, message } = hookResult(run(v, [], { root: roots[c.root], env: c.env, input }));
    const ok = result === c.expect && (!c.says || message.includes(c.says));
    if (!ok) failed++;
    rows.push({ ok, version: v.label, name: c.name, expect: c.expect, got: result, message });
  }
}

for (const c of cases.check) {
  for (const v of versions) {
    const flag = v.label === 'ps1' ? ['-Check', '-Root', roots[c.root]] : ['--check', '--root', roots[c.root].replaceAll('\\', '/')];
    const { code, out } = run(v, flag, { root: roots[c.root] });
    const got = code === 0 ? 'pass' : code === 1 ? 'fail' : `error (exit ${code})`;
    const missing = (c.says || []).filter((s) => !out.includes(s));
    const ok = got === c.expect && missing.length === 0;
    if (!ok) failed++;
    rows.push({ ok, version: v.label, name: `check: ${c.name}`, expect: c.expect, got, message: missing.length ? `missing: ${missing.join(' | ')}` : out.split('\n').join(' | ') });
  }
}

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
console.log(`Versions run: ${versions.map((v) => v.label).join(', ') || 'none'}`);
for (const r of rows) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.version.padEnd(3)}  ${clip(r.name, 52).padEnd(52)}  ${r.expect.padEnd(5)} → ${r.got.padEnd(5)}  ${clip(r.message, 110)}`);
}
const total = rows.length;
console.log(`\n${total - failed}/${total} passed${versions.length < 2 ? ' (only one version could run here)' : ''}`);
process.exit(failed || versions.length === 0 ? 1 : 0);
