// AISkillet — Tier 1 (manifest) validation.
// Validates every entries/*.json against the JSON Schema, then applies
// AISkillet-specific rules: filename↔name match, uniqueness, and the
// install-command safety allowlist. Static-only — we never execute anything.
//
// Usage: node scripts/validate.mjs   (exit 1 on any failure)

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENTRIES_DIR = join(ROOT, "entries");
const SCHEMA_PATH = join(ROOT, "schema", "entry.schema.json");

// --- install-command safety allowlist (Tier 1) ---------------------------
// Allowed: our slash-command install forms. Rejected: anything that could run
// arbitrary code on the user's machine.
const INSTALL_ALLOW = /^\/(plugin|skill|agent|mcp)\s+[\w@/.\- ]+$/;
// MCP servers install via `claude mcp add … -- <runner> <pkg> [args]` (mcp type only).
const INSTALL_ALLOW_MCP = /^claude mcp add [\w@/.\-~ ]+$/;
// Word-boundaried so legit names like "source-evaluation" (contains "eval") aren't false-flagged.
const INSTALL_DENY = /(\bcurl\b|\bwget\b|\bbash\b|\bsh\s+-c|\beval\b|\bbase64\b|\||;|&&|`|\$\()/i;

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function validateAll() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(loadJson(SCHEMA_PATH));

  const files = readdirSync(ENTRIES_DIR).filter((f) => f.endsWith(".json"));
  const errors = [];
  const seenNames = new Set();

  for (const file of files) {
    const entry = loadJson(join(ENTRIES_DIR, file));
    const where = `entries/${file}`;

    // 1. Schema
    if (!validate(entry)) {
      for (const e of validate.errors) {
        errors.push(`${where}: schema ${e.instancePath || "/"} ${e.message}`);
      }
      continue; // schema failed — skip further checks on this file
    }

    // 2. Filename must match name
    if (basename(file, ".json") !== entry.name) {
      errors.push(`${where}: filename must match "name" (expected ${entry.name}.json)`);
    }

    // 3. Uniqueness
    if (seenNames.has(entry.name)) {
      errors.push(`${where}: duplicate name "${entry.name}"`);
    }
    seenNames.add(entry.name);

    // 4. Install-command safety allowlist
    const installOk =
      INSTALL_ALLOW.test(entry.install) ||
      (entry.type === "mcp" && INSTALL_ALLOW_MCP.test(entry.install));
    if (INSTALL_DENY.test(entry.install) || !installOk) {
      errors.push(
        `${where}: install command failed safety allowlist: ${JSON.stringify(entry.install)}`
      );
    }
  }

  return { count: files.length, errors };
}

// Run directly (not when imported by build.mjs)
if (import.meta.url === `file://${process.argv[1]}`) {
  const { count, errors } = validateAll();
  if (errors.length) {
    console.error(`✗ Validation failed (${errors.length} issue(s) across ${count} entr${count === 1 ? "y" : "ies"}):\n`);
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }
  console.log(`✓ ${count} entr${count === 1 ? "y" : "ies"} valid.`);
}
