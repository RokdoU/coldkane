import type { Mission } from "@/lib/types";
import { formatEuros, TIER_LABELS } from "@/lib/ranking";
import { Countdown } from "./countdown";

export function MissionCard({ mission }: { mission: Mission }) {
  const progress = Math.min(mission.meetingsValidated / mission.meetingsTarget, 1);
  return (
    <article
      className={`rounded-2xl border bg-night-800 p-5 transition hover:-translate-y-0.5 ${
        mission.isBounty
          ? "border-ember-500/50 glow-ember"
          : "border-night-600 hover:border-ice-500/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
            {mission.companyName} · {mission.sector}
          </p>
          <h3 className="mt-1 font-bold leading-snug">{mission.title}</h3>
        </div>
        {mission.isBounty && (
          <span className="shrink-0 rounded-full bg-ember-500/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-ember-400">
            Bounty
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-foreground/60">{mission.description}</p>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-2xl font-black text-ice-300">
            {formatEuros(mission.pricePerMeetingCents)}
            <span className="text-sm font-medium text-foreground/40"> / RDV validé</span>
          </p>
          <p className="mt-0.5 text-xs text-foreground/40">
            Escrow sécurisé : {formatEuros(mission.budgetCents)}
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
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-night-600">
          <div
            className={`h-full rounded-full ${mission.isBounty ? "bg-ember-500" : "bg-ice-500"}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </article>
  );
}
