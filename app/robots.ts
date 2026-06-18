import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://coldkane.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Indexation publique ouverte, sauf les espaces privés / utilitaires.
      // /api/og/ reste autorisé pour que les crawlers puissent charger les
      // images OG (cartes de partage).
      allow: ["/", "/api/og/"],
      disallow: [
        "/dashboard",
        "/ambassadeur",
        "/entreprises/dashboard",
        "/entreprises/poster",
        "/connexion",
        "/api/",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
