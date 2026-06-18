import type { MetadataRoute } from "next";
import { getLadder } from "@/lib/data";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://coldkane.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ladder = await getLadder();

  return [
    // Pages publiques principales (orientées découverte / conversion)
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/leaderboard`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/missions`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/entreprises`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/inscription`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/charte-contenu`, changeFrequency: "monthly", priority: 0.4 },
    // Pages légales (priorité basse, peu de mises à jour)
    { url: `${BASE}/cgu`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
    // Profils publics des callers, alimentés par le ladder
    ...ladder.map((e) => ({
      url: `${BASE}/c/${e.caller.username}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
