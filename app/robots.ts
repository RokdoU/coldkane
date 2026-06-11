import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://coldkane.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/entreprises/dashboard", "/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
