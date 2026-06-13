// Compteur public « X € versés aux callers » : l'argent réel comme preuve.
// Lit la vue platform_stats (migration 008), cache 60 s côté serveur.

import { unstable_cache } from "next/cache";
import { isSupabaseConfigured, supabasePublic } from "@/lib/supabase";
import { formatEuros } from "@/lib/ranking";

export interface PlatformStats {
  totalPaidCents: number;
  payoutsCount: number;
}

// Démo : cohérent avec mock-data (159 RDV validés sur le ladder, ~135 € net/RDV)
const DEMO_STATS: PlatformStats = {
  totalPaidCents: 2_146_500,
  payoutsCount: 159,
};

// La page reste dynamique (session dans la nav) : on cache la requête
// elle-même, revalidée toutes les 60 s — le chiffre vit sans marteler la base.
const fetchPlatformStats = unstable_cache(
  async (): Promise<PlatformStats> => {
    const { data } = await supabasePublic().from("platform_stats").select("*").single();
    return {
      totalPaidCents: (data?.total_paid_cents as number) ?? 0,
      payoutsCount: (data?.payouts_count as number) ?? 0,
    };
  },
  ["platform-stats"],
  { revalidate: 60 },
);

export async function getPlatformStats(): Promise<PlatformStats> {
  if (!isSupabaseConfigured()) return DEMO_STATS;
  return fetchPlatformStats();
}

// Le chiffre, gros et sec. Pas d'animation, pas d'astérisque : un total réel.
export function PayoutCounter({ stats }: { stats: PlatformStats }) {
  return (
    <div className="text-center">
      <p className="display tnum text-4xl tracking-tight text-ice-300 sm:text-5xl">
        {formatEuros(stats.totalPaidCents)}
      </p>
      <p className="micro mt-2.5 text-foreground/40">
        versés aux callers — {stats.payoutsCount.toLocaleString("fr-FR")} RDV payés à la
        validation
      </p>
    </div>
  );
}
