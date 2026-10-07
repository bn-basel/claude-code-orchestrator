# Claude Code Orchestrator — this repo

A public template of a multi-agent workflow for Claude Code, plus its project page.

- `template/`: the files people install. Generic only: placeholders like `{{PROJECT_NAME}}`, never a real product,
  client, provider, path, phone number or email.
- `INSTALL-PROMPT.md`: the prompt that installs `template/` into another project. Keep it in step with `template/`.
- `docs/`: the project page (GitHub Pages, served from `/docs`). Plain HTML/CSS/JS, no build step, no trackers.
- `CHANGELOG.md`: every change to the system, with the lesson behind it. The site's "Lessons" section mirrors it.

## Rules

- When the template changes (a helper, a rule, the loop), update `README.md`, `CHANGELOG.md` and `docs/` in the same commit.
- No secrets, no personal data, nothing product-specific. Before committing, search for names of real products and paths.
- No AI attribution lines in commits or PRs (set in `.claude/settings.json`).

## The page

- Preview: `python -m http.server 8471 --directory docs` → http://127.0.0.1:8471 (or `.claude/launch.json` "docs"),
  or double-click `docs/index.html`.
- The two loop diagrams (horizontal ≥1140px, vertical below) are inline SVG inside `index.html` between
  `<!-- diagram:h -->` / `<!-- diagram:v -->` markers. Stage details live in the `.stage-detail` articles below them.
- Check it at 375px and 1440px, light and dark, before calling a change done.
