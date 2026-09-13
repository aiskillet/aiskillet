// AISkillet — build step.
// Validates entries, then compiles them into two artifacts:
//   dist/index.json        → the frontend's data source (search/filter/sort)
//   dist/marketplace.json  → Claude Code-compatible marketplace manifest
//
// Enrichment (GitHub stars, readme, last commit) is stubbed for Phase 0 so the
// build runs fully offline. Phase 1 will populate derived fields via the GitHub API.
//
// Usage: node scripts/build.mjs

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateAll } from "./validate.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENTRIES_DIR = join(ROOT, "entries");
// Emit into public/ so Astro serves them at /index.json and /marketplace.json
const OUT_DIR = join(ROOT, "public");

const MARKETPLACE_NAME = "aiskillet";

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

// --- 1. validate first — never build a broken catalog --------------------
const { count, errors } = validateAll();
if (errors.length) {
  console.error(`✗ Build aborted: ${errors.length} validation issue(s).`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

// --- 2. read + enrich entries --------------------------------------------
const entries = readdirSync(ENTRIES_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => loadJson(join(ENTRIES_DIR, f)))
  .map((e) => ({
    ...e,
    verified: e.verified ?? false,
    tags: e.tags ?? [],
    // derived (Phase 1: populate from GitHub API)
    stars: null,
    installs: 0,
    readmeUrl: `${e.repo}/blob/main/${e.path ? e.path + "/" : ""}SKILL.md`,
    lastCommit: null,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

// --- 3. index.json (frontend) --------------------------------------------
const index = {
  generatedAt: new Date().toISOString(),
  count: entries.length,
  entries,
};

// --- 4. marketplace.json (Claude Code) -----------------------------------
const marketplace = {
  name: MARKETPLACE_NAME,
  owner: { name: "AISkillet", url: "https://aiskillet.com" },
  plugins: entries.map((e) => {
    const [owner, repo] = new URL(e.repo).pathname.replace(/^\//, "").replace(/\.git$/, "").split("/");
    return {
      name: e.name,
      description: e.description,
      category: e.tags[0] ?? e.type,
      author: { name: e.author.replace(/^github:/, "") },
      source: { source: "github", repo: `${owner}/${repo}`, ...(e.path ? { path: e.path } : {}) },
    };
  }),
};

// --- 5. write ------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2) + "\n");
writeFileSync(join(OUT_DIR, "marketplace.json"), JSON.stringify(marketplace, null, 2) + "\n");

console.log(`✓ Built ${entries.length} entr${entries.length === 1 ? "y" : "ies"} → public/index.json, public/marketplace.json`);
