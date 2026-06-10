import Link from "next/link";
import type { LadderEntry } from "@/lib/types";
import { TierBadge } from "./tier-badge";
import { Flame } from "./icons";

const TOP3_COLORS = ["text-tier-or", "text-tier-argent", "text-tier-bronze"];

function RankCell({ rank }: { rank: number }) {
  return (
    <span
      className={`display tnum text-base ${
        rank <= 3 ? TOP3_COLORS[rank - 1] : "text-foreground/30"
      }`}
    >
      {String(rank).padStart(2, "0")}
    </span>
  );
}

export function LadderTable({ entries, compact = false }: { entries: LadderEntry[]; compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-night-600 bg-night-800">
      <table className="w-full text-left text-sm">
        <thead className="micro border-b border-night-600 text-foreground/35">
          <tr>
            <th className="px-4 py-3 font-medium">Rang</th>
            <th className="px-4 py-3 font-medium">Caller</th>
            <th className="px-4 py-3 text-right font-medium">Points</th>
            <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">RDV</th>
            {!compact && <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Streak</th>}
            <th className="px-4 py-3 text-right font-medium">Tier</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-night-600/70">
          {entries.map((e) => (
            <tr key={e.caller.id} className="transition-colors duration-200 hover:bg-night-700">
              <td className="w-16 px-4 py-3.5">
                <RankCell rank={e.rank} />
              </td>
              <td className="px-4 py-3.5">
                <Link href={`/c/${e.caller.username}`} className="group flex cursor-pointer items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      e.rank <= 3 ? "bg-ice-400/10 text-ice-300" : "bg-night-600 text-foreground/55"
                    }`}
                  >
                    {e.caller.fullName.charAt(0)}
                  </span>
                  <span>
                    <span className="block font-medium transition-colors duration-200 group-hover:text-ice-300">
                      {e.caller.username}
                    </span>
                    {e.caller.headline && (
                      <span className="block text-xs text-foreground/35">{e.caller.headline}</span>
                    )}
                  </span>
                </Link>
              </td>
              <td className="display tnum px-4 py-3.5 text-right text-[15px]">
                {e.points.toLocaleString("fr-FR")}
              </td>
              <td className="tnum hidden px-4 py-3.5 text-right text-foreground/60 sm:table-cell">
                {e.meetingsValidated}
              </td>
              {!compact && (
                <td className="hidden px-4 py-3.5 text-right md:table-cell">
                  <span className="tnum inline-flex items-center gap-1 text-foreground/60">
                    {e.bestStreak >= 5 && <Flame className="h-3.5 w-3.5 text-ember-400" />}
                    {e.bestStreak}
                  </span>
                </td>
              )}
              <td className="px-4 py-3.5 text-right">
                <TierBadge tier={e.tier} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
