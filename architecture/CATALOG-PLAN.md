# Catalog Seed Plan — 500 curated first-party entries

Goal: seed AISkillet with **500 genuinely useful, original** entries so every type + category
looks alive and is actually usable. Quality bar per §14 of ARCHITECTURE.md. No filler.

## Distribution by type

| Type | Target | Source of "real" content |
|---|---|---|
| Skills | 320 | `aiskillet/cookbook/skills/<name>/SKILL.md` |
| Agents | 120 | `aiskillet/cookbook/agents/<name>/AGENT.md` (subagent frontmatter) |
| Plugins | 40 | `aiskillet/cookbook/plugins/<name>/` — themed bundles of our skills/agents |
| MCPs | 20 | pointer-entries to **real** MCP server repos (verified URLs) |

## Rules
- Every entry points to real, fetchable content (CLI does raw fetch on install).
- One category per entry; free tags for granularity.
- Commit + push after **each batch**; site auto-deploys via Vercel.
- Web research = inspiration for *what matters*, never copied content.

## Category coverage targets (across all types, ~50 each)
Coding · DevOps · Data & ML · Design · Writing & Content · Research · Productivity · Business · Security · Integrations

## Topic backlog (skills — first passes)

**Coding:** error-handling, refactoring-patterns, logging-observability, git-workflow,
concurrency-patterns, dependency-management, performance-profiling, api-versioning,
regex-patterns, type-safety, code-comments, naming-things, pagination-patterns, caching-strategies

**DevOps:** dockerfile-best-practices, ci-cd-pipelines, kubernetes-basics, terraform-patterns,
github-actions, observability-slos, incident-response, blue-green-deploys, secrets-in-ci,
container-security, load-testing, log-aggregation

**Data & ML:** sql-optimization, pandas-patterns, prompt-engineering, rag-patterns,
feature-engineering, data-validation, experiment-tracking, model-evaluation, etl-design,
vector-search, data-cleaning, notebook-hygiene

**Security:** secrets-management, input-validation, authn-vs-authz, threat-modeling,
dependency-audit, owasp-top-10, jwt-handling, rate-limiting, csrf-xss-defense, least-privilege

**Design:** design-systems, accessibility-a11y, ux-writing, color-contrast, responsive-layout,
component-api-design, design-tokens, empty-states

**Writing & Content:** technical-writing, changelog-writing, readme-craft, blog-post-structure,
release-notes, api-docs, tutorial-design, seo-basics

**Research:** literature-review, competitive-analysis, user-interviews, survey-design,
source-evaluation, synthesis-notes, market-sizing

**Productivity:** meeting-notes, weekly-planning, inbox-zero, decision-logs, okr-drafting,
task-breakdown, time-blocking

**Business:** pricing-strategy, investor-update, cold-outreach, positioning, unit-economics,
customer-discovery, go-to-market

**Integrations:** webhook-design, oauth-flows, api-client-patterns, idempotent-integrations,
retry-backoff, event-driven-patterns, rate-limit-handling

## Agents backlog (first passes)
pr-reviewer, test-writer, bug-triager, refactor-planner, docs-generator, dependency-upgrader,
release-manager, incident-commander, data-analyst, sql-writer, api-designer-agent,
security-auditor, onboarding-buddy, changelog-writer, research-assistant

## Progress log
- Batch 1 (2026-09-13): +8 skills (coding, devops, data-ml, security). Total: 11.
