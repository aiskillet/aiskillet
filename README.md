<div align="center">

# 🍳 AISkillet

### The marketplace for AI skills, plugins, agents & MCP servers

**Write a capability once — install it into Claude Code, Cursor, and any tool with one command.**
Not just a directory: a portable runtime.

[**Website**](https://aiskillet.com) · [**CLI on npm**](https://www.npmjs.com/package/@aiskillet/cli) · [**Cookbook**](https://github.com/aiskillet/cookbook) · [**Architecture**](architecture/ARCHITECTURE.md) · [**Security**](architecture/SECURITY.md)

[![npm](https://img.shields.io/npm/v/@aiskillet/cli?color=e0632b&label=%40aiskillet%2Fcli)](https://www.npmjs.com/package/@aiskillet/cli)
[![license](https://img.shields.io/badge/license-MIT-e0632b)](LICENSE)
![node](https://img.shields.io/badge/node-%E2%89%A520-e0632b)
![capabilities](https://img.shields.io/badge/capabilities-64-e0632b)

</div>

```bash
npx @aiskillet/cli add code-review --target cursor
```

One command. Installs into **Claude Code**, **Cursor**, **AGENTS.md** & more — compiled to each tool's native format, straight from the source.

---

## What is AISkillet?

Most "AI skill" sites are directories — a list of links. AISkillet is the **registry *and* the runtime**:

- **Registry** — a curated, searchable catalog of skills, plugins, agents, and MCP servers.
- **Runtime** — the [`skillet` CLI](https://www.npmjs.com/package/@aiskillet/cli) that *compiles* a capability into whatever tool you use. Write it once; run it anywhere.

```
find a capability  →  skillet add <name> --target <tool>  →  it runs in your tool, natively
```

The same skill becomes a Claude Code `SKILL.md`, a Cursor `.mdc` rule, or a portable `AGENTS.md` file — automatically. That portability is the thing a plain directory can't give you.

## What's inside

| Type | Count | What it gives you |
|---|---:|---|
| **Skills** | 41 | Reusable expertise: API design, TDD, security, docs, data/ML, DevOps, design, business, and more |
| **Agents** | 8 | Scoped subagents: PR reviewer, test writer, bug triager, security auditor, research assistant… |
| **Plugins** | 8 | Curated bundles that install a whole toolkit at once (e.g. `founder-pack`, `backend-pack`) |
| **MCPs** | 7 | Pointers to real MCP servers (filesystem, git, memory, fetch…) |
| **Total** | **64** | across **10 categories** — Coding · DevOps · Data & ML · Design · Writing · Research · Productivity · Business · Security · Integrations |

Browse them all at **[aiskillet.com](https://aiskillet.com)** — with search, faceted filters, and shareable pages.

## Install anything

```bash
# one skill, into whatever tool you use
npx @aiskillet/cli add api-design --target claude-code
npx @aiskillet/cli add api-design --target cursor

# a whole bundle (installs every member)
npx @aiskillet/cli add founder-pack --target claude-code

# search the marketplace
npx @aiskillet/cli search testing
```

| Target | Output | Location |
|---|---|---|
| `claude-code` | native `SKILL.md` / `AGENT.md` | `.claude/skills` · `.claude/agents` (or `~/.claude` with `--global`) |
| `cursor` | `.mdc` rule | `.cursor/rules/` |
| `agents-md` | portable `AGENTS.md` skill | `.agents/` |
| `agentvoy` | reusable agent instructions for an [AgentVoy](https://github.com/agentvoy/agentvoy) project | `skills/` |

Install the CLI once (`npm i -g @aiskillet/cli`) or use `npx`. Requires Node 20+.

**Not a walled garden.** You don't have to be in the marketplace to use it:

```bash
skillet add owner/repo/path --target cursor          # install straight from ANY repo
export SKILLET_REGISTRY=https://skills.yourco.com/index.json   # or run your own private registry
```

Your code stays in your repo (catalog-not-host). List it here when you want reach — or don't.

## Security — built in, not bolted on

A skill isn't passive data: it's **instructions that steer an AI agent in your environment with real permissions.** That's a threat model npm doesn't have — so we designed for it from day one. Full model: [`architecture/SECURITY.md`](architecture/SECURITY.md).

- **🗂️ Catalog, not host.** We index *pointers*; code stays in the creator's repo. We **never execute** submitted code — eliminating an entire class of attack.
- **🧾 Tier 1 — manifest checks (CI).** Schema validation + an **install-command allowlist** that blocks `curl | bash`, `eval`, pipes, and shell injection. MCPs get only the narrow `claude mcp add …` form.
- **🔍 Tier 2 — content scan (CI).** Every submission's source is fetched and scanned; we **block** prompt-injection directives, secret-exfiltration instructions, and pipe-to-shell, and **flag** risky patterns (`rm -rf`, `eval`, obfuscation) for human review.
- **👤 Tier 3 — human review** gates the ✓ **Verified** badge.
- **📌 Commit-SHA pinning.** Entries can pin a `rev`; the CLI fetches *that exact commit*, not whatever a branch becomes later — defeating time-of-check/time-of-use (TOCTOU) attacks.
- **🔗 Source transparency.** Every listing links to the exact repo/commit. Nothing hidden, nothing bundled.

> Honest limit: detecting malicious *natural-language* instructions isn't fully solvable by regex. Our defense is layered — transparency + the Verified human gate + local sandboxed testing before you trust anything.

## Not just a directory

| A plain directory | AISkillet |
|---|---|
| A list of links | A registry **+** a CLI runtime |
| Copy-paste, reformat per tool | `skillet add` compiles to each tool's native format |
| "Trust me" | Tiered CI safety scan + Verified human review + SHA pinning |
| One tool | Claude Code, Cursor, AGENTS.md (and growing) |
| Static | Merge a PR → live in ~1 min, auto-deployed |

## Featured: Founder Pack

`skillet add founder-pack --target claude-code` installs a **14-capability CEO toolkit** in one command — positioning, pricing, hiring, OKRs, fundraising updates, customer interviews, planning, and a research agent. See it: **[aiskillet.com/founder-pack](https://aiskillet.com/founder-pack)**.

## Submit yours

AISkillet is community-driven. Adding a listing is a **pull request** — CI validates it, a maintainer merges it, and it's live within a minute.

1. Fork this repo, add one file: `entries/<name>.json` (see [`schema/entry.schema.json`](schema/entry.schema.json)).
2. Open a PR using the [template](.github/PULL_REQUEST_TEMPLATE/new-entry.md).
3. CI runs Tier 1 + Tier 2 checks automatically.

First-party skills live in the companion [**aiskillet/cookbook**](https://github.com/aiskillet/cookbook) repo.

## Develop

```bash
npm install
npm run validate   # Tier 1 — schema + install-safety
npm run scan       # Tier 2 — content-safety scan of referenced source
npm run build      # compile catalog → index.json + marketplace.json + Astro site
npm run dev        # local site at localhost:4321
```

## The three repos

| Repo | Role |
|---|---|
| [**aiskillet/aiskillet**](https://github.com/aiskillet/aiskillet) | Platform — catalog, safety pipeline, and website (this repo) |
| [**aiskillet/cookbook**](https://github.com/aiskillet/cookbook) | First-party skills, agents & plugin bundles |
| [**aiskillet/cli**](https://github.com/aiskillet/cli) | The `skillet` CLI ([npm](https://www.npmjs.com/package/@aiskillet/cli)) |

---

<div align="center">

**Cook up your agents.** · [aiskillet.com](https://aiskillet.com)

MIT licensed — use it freely, and contribute back.

</div>
