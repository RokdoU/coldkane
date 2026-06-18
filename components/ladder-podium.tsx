// Podium du top 3 : la zone de flex du ladder. Cartes degen tier-colorées,
// halo, glow et chiffres en dégradé. #1 surélevé au centre (desktop).
// CSS only, respecte prefers-reduced-motion.

import Link from "next/link";
import type { LadderEntry, Tier } from "@/lib/types";
import { TierBadge } from "./tier-badge";
import { Trophy, Medal, Flame } from "./icons";

// Classes statiques par tier (Tailwind ne génère pas les noms construits)
const TIER_STYLE: Record<Tier, { border: string; glow: string; grad: string; ring: string }> = {
  bronze: { border: "border-tier-bronze/30", glow: "bg-tier-bronze/15", grad: "from-tier-bronze via-foreground to-tier-bronze", ring: "ring-tier-bronze/30" },
  argent: { border: "border-tier-argent/30", glow: "bg-tier-argent/15", grad: "from-tier-argent via-foreground to-tier-argent", ring: "ring-tier-argent/30" },
  or: { border: "border-tier-or/35", glow: "bg-tier-or/15", grad: "from-tier-or via-foreground to-tier-or", ring: "ring-tier-or/30" },
  platine: { border: "border-tier-platine/30", glow: "bg-tier-platine/15", grad: "from-tier-platine via-foreground to-tier-platine", ring: "ring-tier-platine/30" },
  diamant: { border: "border-tier-diamant/30", glow: "bg-tier-diamant/15", grad: "from-tier-diamant via-foreground to-tier-diamant", ring: "ring-tier-diamant/30" },
  legende: { border: "border-tier-legende/35", glow: "bg-tier-legende/20", grad: "from-tier-legende via-foreground to-tier-legende", ring: "ring-tier-legende/35" },
};

const ORDER = ["order-1 sm:order-2", "order-2 sm:order-1", "order-3 sm:order-3"];

function PodiumCard({ entry, slot }: { entry: LadderEntry; slot: number }) {
  const s = TIER_STYLE[entry.tier];
  const first = entry.rank === 1;
  const RankIcon = entry.rank === 1 ? Trophy : Medal;

  return (
    <div
      className={`group relative ${ORDER[slot]} ${first ? "" : "sm:mt-10"}`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border ${s.border} bg-night-800 p-5 text-center transition-transform duration-300 hover:-translate-y-1 ${
          first ? "sm:p-6" : ""
        }`}
      >
        {/* Halo dérivant */}
        <div className={`pointer-events-none absolute -left-6 -top-8 h-24 w-24 rounded-full blur-3xl ${s.glow} animate-halo-drift`} aria-hidden />
        {first && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-sweep" aria-hidden />
        )}

        {/* Rang + icône */}
        <div className="relative flex items-center justify-center gap-1.5">
          <RankIcon className={`h-4 w-4 ${first ? "text-tier-or" : "text-foreground/40"}`} />
          <span className="micro text-foreground/40">#{entry.rank}</span>
        </div>

        {/* Avatar */}
        <Link
          href={`/c/${entry.caller.username}`}
          aria-label={`Profil de ${entry.caller.username}`}
          className="group/av relative mx-auto mt-4 block w-fit rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-400"
        >
          <span
            aria-hidden
            className={`flex items-center justify-center rounded-full bg-night-700 font-semibold text-foreground/80 ring-2 ${s.ring} ${
              first ? "h-16 w-16 text-2xl" : "h-12 w-12 text-lg"
            }`}
          >
            {entry.caller.fullName.charAt(0)}
          </span>
        </Link>

        {/* Pseudo + tier */}
        <Link
          href={`/c/${entry.caller.username}`}
          aria-label={`Profil de ${entry.caller.username}`}
          className="relative mt-3 block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-400"
        >
          <span className="block font-semibold transition-colors duration-200 group-hover:text-foreground">
            {entry.caller.username}
          </span>
        </Link>
        <div className="relative mt-2 flex justify-center">
          <TierBadge tier={entry.tier} size="sm" />
        </div>

        {/* Points en dégradé */}
        <p
          className={`tnum relative mt-4 bg-gradient-to-r bg-clip-text text-transparent ${s.grad} ${first ? "text-4xl" : "text-3xl"} font-bold leading-none`}
          style={{ fontFamily: "var(--font-grotesk), sans-serif", letterSpacing: "-0.02em" }}
        >
          {entry.points.toLocaleString("fr-FR")}
        </p>
        <p className="micro relative mt-1 text-foreground/35">points</p>

        {/* Chips RDV + streak */}
        <div className="relative mt-4 flex items-center justify-center gap-2 text-xs text-foreground/55">
          <span className="tnum rounded-full bg-night-700 px-2.5 py-1">{entry.meetingsValidated} RDV</span>
          {entry.bestStreak >= 5 && (
            <span className="tnum inline-flex items-center gap-1 rounded-full bg-ember-500/10 px-2.5 py-1 text-ember-400">
              <Flame className="h-3 w-3" />
              {entry.bestStreak}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function LadderPodium({ entries }: { entries: LadderEntry[] }) {
  const top3 = entries.slice(0, 3);
  if (top3.length < 3) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
      {top3.map((e, i) => (
        <PodiumCard key={e.caller.id} entry={e} slot={i} />
      ))}
    </div>
  );
}
