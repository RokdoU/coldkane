import type { Mission } from "@/lib/types";
import { formatEuros, TIER_LABELS } from "@/lib/ranking";
import { Countdown } from "./countdown";
import { Lock, Zap } from "./icons";

export function MissionCard({ mission }: { mission: Mission }) {
  const progress = Math.min(mission.meetingsValidated / mission.meetingsTarget, 1);
  return (
    <article
      className={`cut group relative cursor-pointer border bg-night-800 p-5 transition-colors duration-200 ${
        mission.isBounty
          ? "border-ember-500/60 hover:border-ember-400"
          : "border-night-600 hover:border-ice-500/50"
      }`}
    >
      {mission.isBounty && (
        <div className="stripes-ember pointer-events-none absolute inset-x-0 top-0 h-1.5" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="display text-[11px] tracking-[0.2em] text-foreground/40">
            {mission.companyName} · {mission.sector}
          </p>
          <h3 className="mt-1.5 font-bold leading-snug">{mission.title}</h3>
        </div>
        {mission.isBounty && (
          <span className="display cut-sm flex shrink-0 items-center gap-1 bg-ember-500/15 px-3 py-1 text-[11px] tracking-[0.15em] text-ember-400">
            <Zap className="h-3 w-3" />
            Bounty
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-foreground/55">{mission.description}</p>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="display text-2xl text-ice-300">
            {formatEuros(mission.pricePerMeetingCents)}
            <span className="font-sans ml-1 text-sm font-medium normal-case tracking-normal text-foreground/40">
              / RDV validé
            </span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground/40">
            <Lock className="h-3 w-3" />
            Escrow : {formatEuros(mission.budgetCents)}
            {mission.minTier && ` · ${TIER_LABELS[mission.minTier]}+ requis`}
          </p>
        </div>
        {mission.isBounty && mission.bountyDeadline && <Countdown deadline={mission.bountyDeadline} />}
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-foreground/40">
          <span>
            {mission.meetingsValidated}/{mission.meetingsTarget} RDV
          </span>
          <span className="display">{Math.round(progress * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 bg-night-600">
          <div
            className={`h-full transition-[width] duration-300 ${mission.isBounty ? "bg-ember-500" : "bg-ice-400"}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </article>
  );
}
