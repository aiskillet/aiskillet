// Shared category taxonomy — the single source of truth for the browse axis.
// Keep the slugs in sync with schema/entry.schema.json (JSON can't import).

export const CATEGORIES = [
  { slug: "coding", label: "Coding" },
  { slug: "devops", label: "DevOps" },
  { slug: "data-ml", label: "Data & ML" },
  { slug: "design", label: "Design" },
  { slug: "writing", label: "Writing & Content" },
  { slug: "research", label: "Research" },
  { slug: "productivity", label: "Productivity" },
  { slug: "business", label: "Business" },
  { slug: "security", label: "Security" },
  { slug: "integrations", label: "Integrations" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export const TYPES = ["skill", "plugin", "agent", "mcp"] as const;
export const TYPE_LABELS: Record<string, string> = {
  skill: "Skills",
  plugin: "Plugins",
  agent: "Agents",
  mcp: "MCPs",
};
