"""Usage log: one line per Claude Code session, from the local transcripts.

Reads ~/.claude/projects/**.jsonl (read-only) and writes _usage/usage-log.md in the workspace (gitignored: it lists
every project on this machine). Each line: date, project, main model, turns, peak context, average context, helper
launches; then helper runs by model. "Context" = tokens the model re-read on that turn
(input + cache read + cache write). Run it weekly and compare the average context.

    python tools/usage_log.py                    # sessions active in the last 14 days
    python tools/usage_log.py --since 2026-01-01
    python tools/usage_log.py --project my-app   # only folders whose name contains "my-app"
"""
import argparse
import collections
import datetime as dt
import glob
import json
import os
import re

ROOT = os.path.expanduser("~/.claude/projects")
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "_usage", "usage-log.md")


def scan(path):
    models = collections.Counter()
    turns = peak = total = helpers = 0
    first = None
    with open(path, encoding="utf-8", errors="ignore") as f:
        for line in f:
            if '"usage"' not in line:
                continue
            try:
                d = json.loads(line)
            except ValueError:
                continue
            m = d.get("message")
            if d.get("type") != "assistant" or not isinstance(m, dict) or not m.get("usage"):
                continue
            u = m["usage"]
            ctx = (u.get("input_tokens") or 0) + (u.get("cache_read_input_tokens") or 0) + (u.get("cache_creation_input_tokens") or 0)
            turns += 1
            peak = max(peak, ctx)
            total += ctx
            models[m.get("model", "?")] += 1
            first = first or (d.get("timestamp") or "")[:10]
            for b in m.get("content") or []:
                if isinstance(b, dict) and b.get("type") == "tool_use" and b.get("name") in ("Agent", "Task"):
                    helpers += 1
    if not turns:
        return None
    return {"date": first, "model": models.most_common(1)[0][0], "turns": turns,
            "peak": peak, "avg": total // turns, "helpers": helpers}


def k(n):
    return f"{n / 1000:.0f}k"


def project_name(folder):
    # Claude Code names each folder after the project path ("C--work-my-app", "-home-me-my-app"). Keep the last
    # few parts, so the log shows "work-my-app" rather than the whole path.
    name = re.sub(r"^[A-Za-z]--", "", folder).strip("-")
    return "-".join(name.split("-")[-3:])[:40]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--since", default=(dt.date.today() - dt.timedelta(days=14)).isoformat())
    ap.add_argument("--project", default="")
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args()

    mains, subs = [], collections.defaultdict(list)
    for path in glob.glob(os.path.join(ROOT, "*", "**", "*.jsonl"), recursive=True):
        folder = os.path.relpath(path, ROOT).split(os.sep)[0]
        if a.project and a.project.lower() not in folder.lower():
            continue
        if dt.date.fromtimestamp(os.path.getmtime(path)).isoformat() < a.since:
            continue
        r = scan(path)
        if not r:
            continue
        if "subagents" in path.split(os.sep):
            subs[r["model"]].append(r["avg"])
        else:
            mains.append((r["date"], project_name(folder), r))

    mains.sort(key=lambda x: x[0])
    lines = [f"# Usage log (sessions active since {a.since})", "",
             f"Generated {dt.datetime.now():%Y-%m-%d %H:%M}. Context = tokens re-read per turn.", "",
             "| Date | Project | Model | Turns | Peak context | Avg context | Helpers |",
             "|---|---|---|---|---|---|---|"]
    for date, project, r in mains:
        lines.append(f"| {date} | {project} | {r['model']} | {r['turns']} | {k(r['peak'])} | {k(r['avg'])} | {r['helpers']} |")
    lines += ["", "## Helper runs by model", "", "| Model | Runs | Avg context |", "|---|---|---|"]
    for model, avgs in sorted(subs.items(), key=lambda x: -len(x[1])):
        lines.append(f"| {model} | {len(avgs)} | {k(sum(avgs) // len(avgs))} |")

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"{len(mains)} sessions, {sum(len(v) for v in subs.values())} helper runs -> {a.out}")


if __name__ == "__main__":
    main()
