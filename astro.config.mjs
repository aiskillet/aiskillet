import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static site (default output) — deploys to Vercel with zero config.
export default defineConfig({
  site: "https://aiskillet.com",
  integrations: [sitemap()],
});
