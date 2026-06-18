import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://coldkane.vercel.app";

// Espaces privés / utilitaires : jamais indexés. /api/og reste ouvert (cartes).
const DISALLOW = [
  "/dashboard",
  "/ambassadeur",
  "/entreprises/dashboard",
  "/entreprises/poster",
  "/connexion",
  "/api/",
];
const ALLOW = ["/", "/api/og/"];

// GEO : on AUTORISE explicitement les crawlers IA (le but est d'être lu et cité
// par les moteurs génératifs). Google-Extended / Applebot-Extended notamment
// doivent être autorisés pour entrer dans Google AI / Apple Intelligence.
const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Meta-ExternalAgent",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ALLOW, disallow: DISALLOW },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: ALLOW, disallow: DISALLOW })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
