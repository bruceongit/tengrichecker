import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const checks = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/checks" }),
  schema: z.object({
    title: z.string(),
    claim: z.string(),
    quote: z.string(),
    rating: z.enum(["true", "mostly-true", "mixture", "misleading", "unproven", "no-evidence", "false", "opinion", "team-denial"]),
    order: z.number(),
    featured: z.boolean().default(false),
    followUp: z.boolean().default(false), // quote comes from his follow-up posts, not the main tweet
    summary: z.string(),
    case: z.string().default("schiffy-fleet"),
    reviewed: z.string().default("2026-11-02"),
    sources: z.array(z.object({ label: z.string(), url: z.string() })),
  }),
});

export const collections = { checks };
