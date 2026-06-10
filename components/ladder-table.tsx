import Link from "next/link";
import type { LadderEntry } from "@/lib/types";
import { TierBadge } from "./tier-badge";

function RankCell({ rank }: { rank: number }) {
  if (rank <= 3) {
    const medals = ["🥇", "🥈", "🥉"];
    return <span className="text-xl">{medals[rank - 1]}</span>;
  }
  return <span className="font-mono text-foreground/50">#{rank}</span>;
}

export function LadderTable({ entries, compact = false }: { entries: LadderEntry[]; compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-night-600 bg-night-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-night-600 bg-night-700 text-xs uppercase tracking-wider text-foreground/50">
          <tr>
            <th className="px-4 py-3">Rang</th>
            <th className="px-4 py-3">Caller</th>
            <th className="px-4 py-3 text-right">Points</th>
            <th className="hidden px-4 py-3 text-right sm:table-cell">RDV validés</th>
            {!compact && <th className="hidden px-4 py-3 text-right md:table-cell">Meilleur streak</th>}
            <th className="px-4 py-3 text-right">Tier</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-night-600/60">
          {entries.map((e) => (
            <tr key={e.caller.id} className="transition hover:bg-night-700/60">
              <td className="px-4 py-3 w-16">
                <RankCell rank={e.rank} />
              </td>
              <td className="px-4 py-3">
                <Link href={`/c/${e.caller.username}`} className="group flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-night-600 font-bold text-ice-300">
                    {e.caller.fullName.charAt(0)}
                  </span>
                  <span>
                    <span className="block font-semibold group-hover:text-ice-300">
                      {e.caller.username}
                    </span>
                    {e.caller.headline && (
                      <span className="block text-xs text-foreground/40">{e.caller.headline}</span>
                    )}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold text-ice-300">
                {e.points.toLocaleString("fr-FR")}
              </td>
              <td className="hidden px-4 py-3 text-right font-mono sm:table-cell">
                {e.meetingsValidated}
              </td>
              {!compact && (
                <td className="hidden px-4 py-3 text-right font-mono md:table-cell">
                  {e.bestStreak >= 5 ? "🔥 " : ""}
                  {e.bestStreak}
                </td>
              )}
              <td className="px-4 py-3 text-right">
                <TierBadge tier={e.tier} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
