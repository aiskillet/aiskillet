import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORY_SLUGS } from "./lib/taxonomy";

// The catalog "database": one JSON per listing in entries/.
// Schema mirrors schema/entry.schema.json (kept in sync manually for now).
const entries = defineCollection({
  loader: glob({ pattern: "*.json", base: "./entries" }),
  schema: z.object({
    name: z.string(),
    type: z.enum(["skill", "plugin", "agent", "mcp"]),
    category: z.enum(CATEGORY_SLUGS as [string, ...string[]]),
    title: z.string(),
    description: z.string(),
    author: z.string(),
    repo: z.string().url(),
    path: z.string().optional(),
    rev: z.string().optional(),
    install: z.string(),
    targets: z.array(z.enum(["claude-code", "cursor", "copilot", "codex", "mcp"])),
    tags: z.array(z.string()).default([]),
    license: z.string(),
    verified: z.boolean().default(false),
    createdAt: z.string().optional(),
  }),
});

export const collections = { entries };
