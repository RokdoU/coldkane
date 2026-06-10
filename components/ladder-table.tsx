import Link from "next/link";
import type { LadderEntry } from "@/lib/types";
import { TierBadge } from "./tier-badge";
import { Flame } from "./icons";

const TOP3_COLORS = ["text-tier-or", "text-tier-argent", "text-tier-bronze"];

function RankCell({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span className={`display text-2xl leading-none ${TOP3_COLORS[rank - 1]}`}>
        {String(rank).padStart(2, "0")}
      </span>
    );
  }
  return (
    <span className="display text-lg leading-none text-foreground/30">
      {String(rank).padStart(2, "0")}
    </span>
  );
}

export function LadderTable({ entries, compact = false }: { entries: LadderEntry[]; compact?: boolean }) {
  return (
    <div className="cut overflow-hidden border border-night-600 bg-night-800">
      <table className="w-full text-left text-sm">
        <thead className="display border-b border-night-600 bg-night-700 text-[11px] tracking-[0.2em] text-foreground/40">
          <tr>
            <th className="px-4 py-3 font-normal">Rang</th>
            <th className="px-4 py-3 font-normal">Caller</th>
            <th className="px-4 py-3 text-right font-normal">Points</th>
            <th className="hidden px-4 py-3 text-right font-normal sm:table-cell">RDV</th>
            {!compact && <th className="hidden px-4 py-3 text-right font-normal md:table-cell">Streak</th>}
            <th className="px-4 py-3 text-right font-normal">Tier</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-night-600/60">
          {entries.map((e) => (
            <tr
              key={e.caller.id}
              className={`transition-colors duration-200 hover:bg-night-700/70 ${
                e.rank <= 3 ? "bg-night-700/30" : ""
              }`}
            >
              <td className="w-16 px-4 py-3">
                <RankCell rank={e.rank} />
              </td>
              <td className="px-4 py-3">
                <Link href={`/c/${e.caller.username}`} className="group flex cursor-pointer items-center gap-3">
                  <span
                    className={`cut-sm flex h-9 w-9 items-center justify-center font-bold ${
                      e.rank <= 3 ? "bg-ice-400/15 text-ice-300" : "bg-night-600 text-foreground/60"
                    }`}
                  >
                    {e.caller.fullName.charAt(0)}
                  </span>
                  <span>
                    <span className="block font-semibold transition-colors duration-200 group-hover:text-ice-300">
                      {e.caller.username}
                    </span>
                    {e.caller.headline && (
                      <span className="block text-xs text-foreground/40">{e.caller.headline}</span>
                    )}
                  </span>
                </Link>
              </td>
              <td className="display px-4 py-3 text-right text-base text-ice-300">
                {e.points.toLocaleString("fr-FR")}
              </td>
              <td className="hidden px-4 py-3 text-right font-semibold text-foreground/70 sm:table-cell">
                {e.meetingsValidated}
              </td>
              {!compact && (
                <td className="hidden px-4 py-3 text-right md:table-cell">
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground/70">
                    {e.bestStreak >= 5 && <Flame className="h-3.5 w-3.5 text-ember-400" />}
                    {e.bestStreak}
                  </span>
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
