# AISkillet — Architecture

> A viral, community-driven marketplace for AI skills, plugins, agents, and MCP servers.
> Tech-agnostic in vision; **catalog-not-host** by design; **~$0 recurring** to run.

---

## 1. Product in one sentence

AISkillet is the place where creators publish AI capabilities (skills / plugins / agents / MCP servers) and users discover and install them into whatever tool they already use (Claude Code first, Cursor / Copilot / others next) — with a one-command install and a source-transparent listing.

---

## 2. Guiding principles (these constrain every decision)

| Principle | Consequence |
|---|---|
| **Store pointers, not packages** | We index metadata; the actual code stays in each creator's own repo. No storage/egress cost, tiny security surface. |
| **GitHub is the backend** | Repo = database, PRs = submissions, Actions = CI/validation, OAuth = auth. Zero servers to run. |
| **Never execute untrusted code** | Users test locally in their own tool. Eliminates the classic marketplace attack surface and compute cost. |
| **Static-first frontend** | Site is prebuilt from a compiled `index.json`. Hosts free on Vercel/Cloudflare Pages, infinite read scale. |
| **Virality is the architecture, not a feature** | Shareable pages, creator profiles, PR-based publishing, seed content — designed in from day one. |
| **Agnostic vision, focused wedge** | Data model supports multiple targets; v1 ships Claude Code + Skills to nail one loop first. |

---

## 3. System overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                                USERS                                    │
│      Consumers (discover / install)          Creators (publish)        │
└───────────────────┬──────────────────────────────────┬───────────────┘
                    │                                    │
                    ▼                                    ▼
┌──────────────────────────────────┐   ┌───────────────────────────────┐
│  FRONTEND — static site          │   │  "Submit yours" flow          │
│  Vercel / Cloudflare Pages       │   │  form → prefilled GitHub PR   │
│  • client-side search & filter   │   │  (GitHub OAuth identity)      │
│  • entry + creator detail pages  │   └───────────────┬───────────────┘
│  • copy install command          │                   │
│  • OG images for shareable links │                   ▼
│  reads → /index.json (static)    │   ┌───────────────────────────────┐
└──────────────────┬───────────────┘   │  REGISTRY REPO (GitHub)       │
                   │ fetch              │  entries/*.json   ← database  │
                   ▼                    │  schema/          ← contract  │
┌──────────────────────────────────┐   │  scripts/build.*  ← compiler  │
│  BUILD ARTIFACTS (static)        │◄──┐│  .github/workflows/           │
│  • index.json  (site data)       │   └┴──────────────┬───────────────┘
│  • marketplace.json (Claude-native)                  │ on PR / on merge
│  • per-entry OG images           │                   ▼
└──────────────────────────────────┘   ┌───────────────────────────────┐
                                        │  GITHUB ACTIONS (CI/CD)       │
                                        │  1. validate manifest (schema)│
                                        │  2. verify repo exists/public │
                                        │  3. safety heuristics scan    │
                                        │  4. enrich (stars, readme)    │
                                        │  5. compile → index/marketplace│
                                        │  6. deploy site               │
                                        └───────────────────────────────┘

   Package source code lives in creators' own repos — never copied here.
   Execution/testing happens locally in the user's own Claude Code / Cursor.
```

**The insight:** GitHub performs every expensive backend role (storage, auth, CI, moderation-via-PR, versioning) for free. Our only owned code is a static frontend + a compile script.

---

## 4. Components

### 4.1 Registry repo (`github.com/aiskillet/registry`)
The source of truth. Human- and machine-editable.

```
registry/
├── entries/                 # one JSON file per listing (the "database")
│   ├── pdf-wizard.json
│   ├── react-refactorer.json
│   └── ...
├── schema/
│   └── entry.schema.json    # JSON Schema — the submission contract
│                            # (first-party skills live in the separate aiskillet/cookbook repo)
├── scripts/
│   ├── build.mjs            # compile entries → index.json + marketplace.json
│   ├── validate.mjs         # schema + repo-exists + safety checks
│   └── enrich.mjs           # pull stars / readme / license from GitHub API
├── .github/
│   ├── workflows/
│   │   ├── validate-pr.yml  # runs on PRs from creators
│   │   └── build-deploy.yml # runs on merge to main
│   └── PULL_REQUEST_TEMPLATE/
│       └── new-entry.md
└── dist/                    # generated: index.json, marketplace.json (deployed)
```

### 4.2 Build/compiler (`scripts/build.mjs`)
Pure Node, no runtime deps. Reads `entries/*.json`, validates each, enriches with GitHub metadata, and emits:
- **`index.json`** — denormalized array the frontend consumes (search/filter/sort).
- **`marketplace.json`** — Claude Code-compatible marketplace manifest, so a user can add the *entire* AISkillet registry to their tool in one command.
- **OG images** (optional, per entry) for shareable link previews.

### 4.3 Validation (`scripts/validate.mjs`, run in CI)
On every PR:
1. **Schema** — does the entry match `entry.schema.json`?
2. **Uniqueness** — no duplicate `name`.
3. **Repo check** — the `repo` URL exists, is public, resolves.
4. **Safety heuristics** — scan the referenced repo/manifest for secret patterns, obviously malicious install steps, disallowed content.
5. **Bot comment** — posts a pass/fail summary on the PR in seconds.

### 4.4 Frontend (static site)
- Reads `index.json` at load; **client-side** fuzzy search (Fuse.js/lunr) + filters (type, stack, target tool) + sort (trending/newest/most-installed).
- Entry detail page: description, README render, author, stars, verified badge, **copy install command**.
- Creator profile: `/@handle` with their listings + basic stats.
- Every entry/profile emits an **OG image + meta tags** → clean link previews when shared.
- No backend calls at runtime → cache-friendly, free to host, fast everywhere.

### 4.5 Submission flow
"Submit yours" → short form → generates a **prefilled Pull Request** against `registry/entries/`. Identity via **GitHub OAuth** (no bespoke auth). Merge = live within ~1 minute (Action recompiles + redeploys).

---

## 5. Data model

One entry = one file (`entries/<name>.json`). Compiled fields (marked *derived*) are added by the build step, not submitted by creators.

```jsonc
{
  "name": "pdf-wizard",              // unique slug; filename matches
  "type": "skill",                   // skill | plugin | agent | mcp
  "title": "PDF Wizard",
  "description": "Extract, merge, and fill PDFs from natural language.",
  "author": "github:janedoe",        // resolved to a creator profile
  "repo": "https://github.com/janedoe/pdf-wizard",
  "install": "/plugin install pdf-wizard@aiskillet",
  "targets": ["claude-code", "cursor"],   // tech-agnostic vision
  "tags": ["documents", "productivity"],
  "license": "MIT",
  "verified": false,                 // true only after human review
  "createdAt": "2026-09-12",

  // ---- derived at build time (do not submit) ----
  "stars": 128,                      // *derived* from GitHub API
  "readmeUrl": "...",                // *derived*
  "installs": 0,                     // *derived* (see §7 analytics)
  "lastCommit": "2026-09-10"         // *derived*
}
```

`entry.schema.json` enforces required fields, enum for `type`/`targets`, slug format for `name`, and URL format for `repo`.

---

## 6. Key flows (sequences)

### 6.1 Consumer: discover → install
```
User → aiskillet.com
Site  → fetch /index.json (static, cached)
User  → search "pdf", filter type=skill, target=claude-code
User  → open entry → read README/stars/verified badge
User  → click "Copy install command"
User  → paste into Claude Code → runs from creator's repo → done
(optional) User → "Add whole marketplace" → registry added natively
```
No server involved. We never run the code — the user's tool does, locally.

### 6.2 Creator: publish (the growth loop)
```
Creator → "Submit yours" → sign in with GitHub (OAuth)
Creator → fill form (name, type, repo, description, tags)
Site    → open prefilled PR to registry/entries/<name>.json
CI      → validate (schema, repo exists, safety) → bot comments pass/fail
Maintainer → merge
CI      → recompile index.json + marketplace.json → redeploy
Creator → gets shareable page aiskillet.com/@creator/<name>
Creator → posts link to X/Reddit/Discord  ← brings their own audience
```

### 6.3 Build/deploy
```
Merge to main
 → Action: validate all → enrich (stars/readme) → build index/marketplace + OG images
 → deploy static site (Pages)
 → live in ~1 minute
```

---

## 7. Analytics (install counts) without a backend

Install counts drive social proof ("trending"), so we want them — but without running a server.
- **v1:** count "copy install" clicks and "add marketplace" events via a privacy-friendly, free analytics endpoint (Cloudflare Web Analytics / Plausible), aggregated back into `index.json` on the next build.
- **Later:** if we ship a thin install proxy, real install telemetry — but only when scale justifies the (small) cost. Not required for launch.

---

## 8. Trust & safety

- Automated PR checks: schema lint, repo-exists, secret/pattern scan, disallowed-content check.
- **Human merge gate** for the `verified` badge; unverified entries can still list but are visually distinct.
- Every listing **links to its source repo** — full transparency, nothing bundled or hidden.
- We **never execute** submitted code → the dominant marketplace threat model largely doesn't apply to us.
- Abuse handling = revert a PR (git), which is instant and auditable.

---

## 9. Tech stack & rationale

| Layer | Choice | Why |
|---|---|---|
| Domain | `aiskillet.com` | Owned, on-brand, .com secured |
| Frontend host | Cloudflare Pages or Vercel | Free static hosting, global CDN |
| Frontend | Static site (Astro recommended for per-entry OG pages; vanilla acceptable for v0) | SSG gives shareable, SEO-friendly pages with zero runtime cost |
| Search | Fuse.js / lunr (client-side) | No search backend; instant; free |
| "Database" | `entries/*.json` in git | Versioned, diffable, PR-reviewable, free |
| Auth | GitHub OAuth | Creators already have GitHub; no auth to build |
| Submissions | Pull requests | Native to dev culture; a merged PR is a bragging moment (virality) |
| CI/CD | GitHub Actions | Free validation + build + deploy |
| Analytics | Cloudflare Web Analytics / Plausible | Free/cheap, privacy-friendly |

**Storage cost is ~$0** because packages live in creators' repos. **Egress cost is ~$0** because installs pull from those repos and GitHub, not from us.

---

## 10. Tech-agnostic strategy

The `targets` array in the data model is the seam that makes this portable:
- **v1:** `claude-code` (+ Skills). Nail one author→install loop and seed the coding pack.
- **v2:** add `cursor`, `copilot`, `mcp` targets; per-target install commands.
- **North star:** a "write-once, install-into-many" capability spec — the real moat — introduced only after the single-target flywheel is proven.

This keeps us out of the "boil the ocean" trap while leaving the door open to the bigger prize.

---

## 11. Cost summary

| Item | Cost |
|---|---|
| Frontend hosting | $0 |
| Database (git) | $0 |
| Auth (GitHub OAuth) | $0 |
| CI/validation (Actions) | $0 |
| Submissions (PRs) | $0 |
| Analytics | $0 (free tier) |
| **Domain** | **~$11 / year** |
| **Total recurring** | **≈ $11 / year** |

---

## 12. Build phases

**Phase 0 — Skeleton (this repo)**
- `entry.schema.json`, 2–3 example entries, `build.mjs`, validate workflow, minimal frontend reading `index.json`.

**Phase 1 — Launchable catalog**
- Search/filter/sort, entry detail pages, copy-install, `marketplace.json`, OG images, seed coding pack, "Submit yours" → PR flow, deploy to aiskillet.com.

**Phase 2 — Creator flywheel**
- Creator profiles, install analytics + "trending", verified badges, remix/fork.

**Phase 3 — Agnostic expansion**
- Additional `targets` (Cursor, Copilot, MCP), multi-target install commands.

---

## 13. Locked decisions (resolved 2026-09-12)

These four were open questions; now decided.

### 13.1 Frontend framework → **Astro**
Virality *is* the architecture, so we need static per-entry + per-creator pages with real OG images and SEO. Astro gives:
- SSG per-entry/per-creator pages → great link previews, SEO, still $0 to host.
- **Content Collections** map 1:1 to `entries/*.json` with built-in Zod schema validation.
- MDX to render `SKILL.md` content on detail pages.
- Zero JS by default → fast everywhere.

Vanilla was rejected: we'd rewrite it the moment we want shareable pages (week one).

### 13.2 Repo layout → **Monorepo now, split registry later**
Single repo `aiskillet/aiskillet` holding `entries/`, `frontend/`, `scripts/`. One CI, one deploy, atomic changes. A `CODEOWNERS` file restricts creator PRs to `entries/` only.
- **Split** the registry into its own repo at **Phase 2**, once PR volume justifies isolating stranger PRs from app code. Not before.

### 13.3 Safety scanning → **3 tiers, static-only (we never execute code)**
All free in GitHub Actions.

| Tier | Checks | On fail |
|---|---|---|
| **T1 — Block (manifest)** | schema valid · `name` unique · `repo` exists & public · license present · install command matches an **allowlisted pattern** (no arbitrary `curl \| bash`) | PR blocked; bot comments reason |
| **T2 — Flag (source scan)** | shallow-clone repo · **gitleaks/trufflehog** (secrets) · **semgrep** ruleset for dangerous patterns (`rm -rf`, `curl\|bash`, `eval(base64)`, network/exfil in hooks, `postinstall` scripts) | Auto-label `needs-review` → human queue |
| **T3 — Verify (human)** | manual review before `verified` badge; anything T2-flagged must pass here | Stays unverified/unlisted |

Because we never run submitted code, this is entirely **static analysis** — cheap, fast, and covers the real threat (malicious install steps / leaked secrets).

### 13.4 Seed coding pack → **~12 original skills; ECC taxonomy as a map only**
We write **original** skills (our voice, structure, examples). ECC ("Everything Claude Code") is used **only** to see which topics matter — no content is copied (it carries its own LICENSE; we take zero content from it). Original v1 coding set:

1. api-design 2. backend-patterns 3. frontend-patterns 4. coding-standards
5. tdd-workflow 6. e2e-testing 7. security-review 8. mcp-server-patterns
9. code-review 10. debugging-playbook 11. refactoring-patterns 12. verification-loop

These live in a **separate first-party content repo, `aiskillet/cookbook`** (real, installable) — treated exactly like any third-party creator's repo. Each skill gets an `entries/*.json` in the platform monorepo pointing at it. Naming note: "marketplace" = the platform/catalog (the monorepo, whose compiled output is `marketplace.json`); `cookbook` = our own skills *content* that the marketplace points at (on-brand with the skillet theme). Benefits: site looks alive on launch, every skill is genuinely usable, and we dogfood our own submission + safety pipeline on content we control.

---

## 14. SKILL.md format & quality bar

Every skill follows the Anthropic Agent Skills convention: a folder with `SKILL.md` (YAML frontmatter + Markdown body), optional `references/` and `agents/` for multi-target metadata.

```
cookbook/                       # aiskillet/cookbook repo (first-party skills)
└── skills/
    └── <skill-name>/
        ├── SKILL.md            # frontmatter: name, description (+ body)
        ├── references/         # optional deep-dive docs
        └── agents/             # optional per-target metadata (future)
```

**Frontmatter contract**
- `name` — kebab-case, matches folder name.
- `description` — one line stating *what it covers* **and** *when to use it* (this is what the model matches on for activation, so it must include trigger conditions).

**Quality bar (what makes an AISkillet skill "good"):**
1. **Activation clarity** — an explicit "When to Activate" section with concrete triggers.
2. **Actionable, not academic** — patterns, checklists, and copy-pasteable examples over prose.
3. **Opinionated defaults** — take a stance; say what to do, not just list options.
4. **Original & concrete** — real code/examples in our voice; no filler.
5. **Scannable** — headings, tables, short code blocks; a model (or human) can jump to the relevant part fast.
6. **Self-contained** — no external dependencies to understand the guidance.
