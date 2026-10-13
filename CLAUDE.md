# Claude Code Orchestrator — this repo

A public template of a multi-agent workflow for Claude Code, plus its project page.

- `template/`: the files people install. Generic only: placeholders like `{{PROJECT_NAME}}`, never a real product,
  client, provider, path, phone number or email.
- `INSTALL-PROMPT.md`: the prompt that installs `template/` into another project. Keep it in step with `template/`.
- `UPGRADE-PROMPT.md`: the prompt that upgrades an installed workspace between tagged versions. Keep it in step too.
- Releases are git tags (`v1.1`, `v1.2`, …). The install line and the upgrade prompt rely on them.
- `docs/`: the project page (GitHub Pages, served from `/docs`). Plain HTML/CSS/JS, no build step, no trackers.
- `CHANGELOG.md`: every change to the system, with the lesson behind it. The site's "Lessons" section mirrors it.

## Rules

- When the template changes (a helper, a rule, the loop), update `README.md`, `CHANGELOG.md` and `docs/` in the same commit.
- No secrets, no personal data, nothing product-specific. Before committing, search for names of real products and paths.
- No AI attribution lines in commits or PRs (set in `.claude/settings.json`).
- This repo runs the template's own helper guard (`template/.claude/hooks/guard-helpers.ps1`) against its own
  `.claude/model-policy.md`: research helpers only, Sonnet or Haiku named in the launch, effort up to xhigh.
- After changing the guard, the policy table or an agent file: `node tests/guard/run.mjs`. Every case must pass in
  both versions (PowerShell and bash).

## The page

- Preview: `python -m http.server 8471 --directory docs` → http://127.0.0.1:8471 (or `.claude/launch.json` "docs"),
  or double-click `docs/index.html`.
- The two loop diagrams (horizontal ≥1140px, vertical below) are inline SVG inside `index.html` between
  `<!-- diagram:h -->` / `<!-- diagram:v -->` markers. Stage details live in the `.stage-detail` articles below them.
- Check it at 375px and 1440px, light and dark, before calling a change done.

## README diagrams

- Source: `docs/assets/diagrams.html` (drawn from data in its script). Edit the data, not coordinates.
- Render each `#loop`, `#team`, `#workspace` svg at device scale 2, light and `?theme=dark`, to
  `docs/assets/<name>-<theme>.png`, then compress (palette PNG). Look at every image before committing.
- The README shows them with `<picture>` so GitHub picks light or dark. Keep the alt text in step with the image.
