import Link from "next/link";
import type { Mission } from "@/lib/types";
import { formatEuros, TIER_LABELS } from "@/lib/ranking";
import { Countdown } from "./countdown";
import { ArrowRight, Lock, Zap } from "./icons";

export function MissionCard({ mission }: { mission: Mission }) {
  const progress = Math.min(mission.meetingsValidated / mission.meetingsTarget, 1);
  return (
    <Link href={`/missions/${mission.id}`} className="block">
      <article
        className={`group rounded-xl border bg-night-800 p-5 transition-colors duration-200 ${
          mission.isBounty
            ? "border-ember-500/35 hover:border-ember-500/60"
            : "border-night-600 hover:border-night-500"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="micro text-foreground/35">
              {mission.companyName} · {mission.sector}
            </p>
            <h3 className="display mt-2 text-[15px] leading-snug">{mission.title}</h3>
          </div>
          {mission.isBounty ? (
            <span className="micro flex shrink-0 items-center gap-1 rounded-full border border-ember-500/30 px-2.5 py-1 text-ember-400">
              <Zap className="h-2.5 w-2.5" />
              Bounty
            </span>
          ) : (
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-foreground/20 transition-colors duration-200 group-hover:text-foreground/50" />
          )}
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-foreground/50">
          {mission.description}
        </p>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="display tnum text-xl">
              {formatEuros(mission.pricePerMeetingCents)}
              <span className="ml-1.5 text-sm font-normal tracking-normal text-foreground/40">
                / RDV validé
              </span>
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-foreground/40">
              <Lock className="h-3 w-3" />
              Escrow : {formatEuros(mission.budgetCents)}
              {mission.minTier && ` · ${TIER_LABELS[mission.minTier]}+ requis`}
            </p>
          </div>
          {mission.isBounty && mission.bountyDeadline && <Countdown deadline={mission.bountyDeadline} />}
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-foreground/40">
            <span className="tnum">
              {mission.meetingsValidated}/{mission.meetingsTarget} RDV
            </span>
            <span className="tnum">{Math.round(progress * 100)}%</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-night-600">
            <div
              className={`h-full rounded-full transition-all duration-500 ${mission.isBounty ? "bg-ember-500" : "bg-ice-500"}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
