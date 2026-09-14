// AISkillet — Tier 2 content-safety scan.
// Catalog-not-host means the risk lives in the *referenced* content, so we fetch
// each entry's source doc and scan for dangerous ops and prompt-injection.
// BLOCK issues fail CI; WARN issues are surfaced for human review.
//
// Usage: node scripts/scan.mjs   (exit 1 on any BLOCK)

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENTRIES_DIR = join(__dirname, "..", "entries");

// Unambiguously malicious in a skill/agent doc → block.
const BLOCK = [
  { re: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions|disregard\s+(the\s+)?(system\s*prompt|previous|above)/i, msg: "prompt-injection override directive" },
  { re: /(curl|wget)\s+[^\n|]*\|\s*(sudo\s+)?(sh|bash|zsh)\b/i, msg: "pipe-to-shell execution (curl|bash)" },
  { re: /(send|post|upload|exfiltrate|leak)\b[^\n]{0,60}(\.env\b|secret|credential|api[ _-]?key|id_rsa|\.ssh)/i, msg: "instruction to exfiltrate secrets" },
];
// Suspicious but sometimes legitimate → warn (human review), don't block.
const WARN = [
  { re: /rm\s+-rf\s+(\/(?!var|tmp|usr|home)|~|\$HOME|\*)/, msg: "destructive rm -rf" },
  { re: /\b(eval\s*\(|atob\s*\(|base64\s+--?d(ecode)?)\b/i, msg: "dynamic eval / base64 decode" },
  { re: /(\\x[0-9a-f]{2}){8,}/i, msg: "hex-obfuscated string" },
];

const parseRepo = (url) => {
  const u = new URL(url);
  const [owner, repo] = u.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/");
  return { owner, repo };
};
const refs = (e) => (e.rev ? [e.rev] : ["main", "master"]);

async function fetchDoc(entry, file) {
  const { owner, repo } = parseRepo(entry.repo);
  const base = entry.path ? entry.path.replace(/\/+$/, "") + "/" : "";
  for (const ref of refs(entry)) {
    const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${base}${file}`);
    if (res.ok) return res.text();
  }
  return null;
}

const entries = readdirSync(ENTRIES_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(ENTRIES_DIR, f), "utf8")));
const names = new Set(entries.map((e) => e.name));

const findings = [];
let blocks = 0;

for (const e of entries) {
  // MCP servers are external processes; their install command is allowlisted in Tier 1.
  if (e.type === "mcp") continue;

  if (e.type === "plugin") {
    const txt = await fetchDoc(e, "plugin.json");
    if (!txt) { findings.push(["BLOCK", e.name, "plugin.json not fetchable"]); blocks++; continue; }
    let manifest;
    try { manifest = JSON.parse(txt); } catch { findings.push(["BLOCK", e.name, "plugin.json is invalid JSON"]); blocks++; continue; }
    for (const inc of manifest.includes ?? []) {
      if (!names.has(inc.name)) { findings.push(["BLOCK", e.name, `bundle references missing entry "${inc.name}"`]); blocks++; }
    }
    continue;
  }

  const file = e.type === "agent" ? "AGENT.md" : "SKILL.md";
  const txt = await fetchDoc(e, file);
  if (!txt) { findings.push(["BLOCK", e.name, `${file} not fetchable from ${e.repo}`]); blocks++; continue; }
  for (const r of BLOCK) if (r.re.test(txt)) { findings.push(["BLOCK", e.name, r.msg]); blocks++; }
  for (const r of WARN) if (r.re.test(txt)) findings.push(["WARN", e.name, r.msg]);
}

for (const [sev, name, msg] of findings) {
  console.log(`${sev === "BLOCK" ? "✗ BLOCK" : "⚠ warn "}  ${name}: ${msg}`);
}
if (!findings.length) console.log("✓ content scan clean.");
console.log(`\nScanned ${entries.length} entries — ${blocks} blocking issue(s).`);
process.exit(blocks ? 1 : 0);
