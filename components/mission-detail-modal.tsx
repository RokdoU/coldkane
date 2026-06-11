import Link from "next/link";
import type { Mission } from "@/lib/types";
import type { SessionProfile } from "@/lib/supabase-server";
import { applyToMission } from "@/lib/actions/missions";
import { formatEuros, TIER_LABELS } from "@/lib/ranking";
import { TierBadge } from "./tier-badge";
import { Countdown } from "./countdown";
import { MissionModalBackdrop } from "./mission-modal-backdrop";
import { ArrowRight, Calendar, Crosshair, Lock, Phone, ShieldCheck, Zap } from "./icons";

export function MissionDetailModal({
  mission,
  profile,
  hasApplied,
}: {
  mission: Mission;
  profile: SessionProfile | null;
  hasApplied: boolean;
}) {
  const progress = Math.min(mission.meetingsValidated / mission.meetingsTarget, 1);
  const remaining = Math.max(
    mission.budgetCents - mission.meetingsValidated * mission.pricePerMeetingCents,
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4">
      <MissionModalBackdrop />

      {/* Modal card */}
      <div
        className="relative z-10 w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-night-500 bg-[#0e0e10] shadow-2xl"
        style={{ animation: "modal-in 0.18s ease-out forwards" }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-night-500" />
        </div>

        <div className="p-6 sm:p-8">
          {/* Close */}
          <Link
            href="/missions"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-night-500 text-xl leading-none text-foreground/40 transition-colors duration-200 hover:border-night-400 hover:text-foreground"
          >
            ×
          </Link>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 pr-10">
            {mission.isBounty && (
              <span className="micro flex items-center gap-1 rounded-full border border-ember-500/40 bg-ember-500/10 px-3 py-1 text-ember-400">
                <Zap className="h-2.5 w-2.5" />
                Bounty
              </span>
            )}
            <span className="micro rounded-full border border-night-500 px-3 py-1 text-foreground/40">
              {mission.sector}
            </span>
            {mission.minTier && <TierBadge tier={mission.minTier} size="sm" />}
          </div>

          {/* Title */}
          <h2 className="display mt-4 text-xl leading-snug tracking-tight sm:text-2xl">
            {mission.title}
          </h2>
          <p className="mt-1.5 text-sm text-foreground/40">{mission.companyName}</p>

          {/* Stats row */}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="display tnum text-2xl">
              {formatEuros(mission.pricePerMeetingCents)}
              <span className="ml-1.5 text-sm font-normal tracking-normal text-foreground/40">
                / RDV validé
              </span>
            </p>
            <p className="tnum text-sm text-foreground/50">
              <span className="font-medium text-foreground">
                {mission.meetingsValidated}
              </span>
              /{mission.meetingsTarget} RDV validés
            </p>
            <p className="tnum text-sm text-foreground/50">
              <span className="font-medium text-ice-300">{formatEuros(remaining)}</span>{" "}
              restants en escrow
            </p>
            {mission.isBounty && mission.bountyDeadline && (
              <Countdown deadline={mission.bountyDeadline} />
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-night-600">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                mission.isBounty ? "bg-ember-500" : "bg-ice-500"
              }`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="mt-6 border-t border-night-600" />

          {/* Two-column content */}
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_220px]">

            {/* Left — cold call briefing */}
            <div className="space-y-5">
              {mission.targetPersona && (
                <section>
                  <h3 className="micro flex items-center gap-1.5 text-foreground/40">
                    <Crosshair className="h-3 w-3" />
                    Qui appeler
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                    {mission.targetPersona}
                  </p>
                </section>
              )}

              {mission.meetingType && (
                <section>
                  <h3 className="micro flex items-center gap-1.5 text-foreground/40">
                    <Calendar className="h-3 w-3" />
                    Type de RDV
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                    {mission.meetingType}
                  </p>
                </section>
              )}

              <section>
                <h3 className="micro flex items-center gap-1.5 text-foreground/40">
                  <Phone className="h-3 w-3" />
                  Contexte
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                  {mission.description}
                </p>
              </section>

              {mission.pitchNotes && (
                <section className="rounded-lg border border-ice-500/20 bg-ice-500/5 p-4">
                  <h3 className="micro flex items-center gap-1.5 text-ice-400">
                    <ShieldCheck className="h-3 w-3" />
                    Notes de pitch
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/65">
                    {mission.pitchNotes}
                  </p>
                </section>
              )}
            </div>

            {/* Right — CTA */}
            <div className="flex flex-col gap-3 lg:pt-0">
              <dl className="space-y-2.5 rounded-lg border border-night-600 p-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-foreground/50">Budget total</dt>
                  <dd className="tnum font-medium">{formatEuros(mission.budgetCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground/50">Restant</dt>
                  <dd className="tnum font-medium text-ice-300">{formatEuros(remaining)}</dd>
                </div>
                {mission.minTier && (
                  <div className="flex items-center justify-between">
                    <dt className="text-foreground/50">Tier min.</dt>
                    <dd><TierBadge tier={mission.minTier} size="sm" /></dd>
                  </div>
                )}
              </dl>

              {!profile && (
                <Link
                  href={`/connexion?next=/missions%3Fid%3D${mission.id}`}
                  className="block w-full cursor-pointer rounded-md bg-foreground px-4 py-3 text-center text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
                >
                  Se connecter pour postuler
                </Link>
              )}

              {profile?.role === "caller" && !hasApplied && (
                <form
                  action={async () => {
                    "use server";
                    await applyToMission(mission.id);
                  }}
                >
                  <button
                    type="submit"
                    className="w-full cursor-pointer rounded-md bg-foreground px-4 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
                  >
                    Postuler à cette mission
                  </button>
                </form>
              )}

              {profile?.role === "caller" && hasApplied && (
                <div className="flex items-center justify-center gap-2 rounded-md border border-ice-500/30 bg-ice-500/10 px-4 py-3 text-sm font-medium text-ice-300">
                  <ShieldCheck className="h-4 w-4" />
                  Candidature envoyée
                </div>
              )}

              {profile?.role === "company" && (
                <Link
                  href="/entreprises/dashboard"
                  className="flex items-center justify-center gap-2 rounded-md border border-night-500 px-4 py-3 text-sm font-medium text-foreground/70 transition-colors duration-200 hover:border-night-400 hover:text-foreground"
                >
                  Gérer mes missions
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}

              <div className="flex items-center gap-1.5 justify-center pt-1">
                <Lock className="h-3 w-3 text-foreground/25" />
                <p className="text-xs text-foreground/30">Budget séquestré en escrow</p>
              </div>

              <Link
                href={`/missions/${mission.id}`}
                className="mt-1 flex items-center justify-center gap-1 text-xs text-foreground/30 transition-colors duration-200 hover:text-foreground/60"
              >
                Fiche complète
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
