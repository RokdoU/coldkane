import type { MetadataRoute } from "next";
import { getLadder } from "@/lib/data";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://coldkane.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ladder = await getLadder();

  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/leaderboard`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/missions`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/entreprises`, changeFrequency: "weekly", priority: 0.8 },
    ...ladder.map((e) => ({
      url: `${BASE}/c/${e.caller.username}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
