# AISkillet

**The marketplace for AI skills, plugins, agents, and MCP servers.**
Discover great AI capabilities and install them into whatever tool you already use — starting with Claude Code.

> Catalog, not host: every listing points at the creator's own public repo. We index metadata; the code stays with its author. See [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md).

## How it works

- Each listing is one file: [`entries/<name>.json`](entries/), validated against [`schema/entry.schema.json`](schema/entry.schema.json).
- The build step compiles all entries into:
  - `dist/index.json` — the website's data source.
  - `dist/marketplace.json` — a Claude Code-compatible marketplace manifest (add the whole catalog in one command).
- Submissions come in as **pull requests** and are checked automatically in CI.

## Develop

```bash
npm install
npm run validate   # Tier 1: schema + install-safety checks
npm run build      # → dist/index.json, dist/marketplace.json
```

## Submit a skill

Open a PR that adds a single `entries/<name>.json`. CI validates it; a maintainer merges it; it's live within a minute. First-party skills live in the companion repo [`aiskillet/cookbook`](https://github.com/aiskillet/cookbook).

## Layout

```
entries/     catalog "database" — one JSON per listing
schema/      submission contract (JSON Schema)
scripts/     build.mjs + validate.mjs
frontend/    Astro site (Phase 1)
architecture/ design docs
```

MIT licensed.
