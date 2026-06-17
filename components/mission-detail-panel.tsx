"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import type { Mission } from "@/lib/types";
import type { SessionProfile } from "@/lib/supabase-server";
import { applyToMission } from "@/lib/actions/missions";
import { formatEuros, TIER_LABELS } from "@/lib/ranking";
import { TierBadge } from "./tier-badge";
import { Countdown } from "./countdown";
import {
  ArrowRight,
  Calendar,
  Crosshair,
  Lock,
  Phone,
  ShieldCheck,
  Zap,
} from "./icons";

export function MissionDetailPanel({
  mission,
  profile,
  hasApplied: initialHasApplied,
  onClose,
}: {
  mission: Mission;
  profile: SessionProfile | null;
  hasApplied: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [applied, setApplied] = useState(initialHasApplied);
  const [applyError, setApplyError] = useState<string | null>(null);

  const progress = Math.min(mission.meetingsValidated / mission.meetingsTarget, 1);
  const remaining = Math.max(
    mission.budgetCents - mission.meetingsValidated * mission.pricePerMeetingCents,
    0,
  );

  // Fermer avec Échap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Bloquer le scroll de la page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleApply = () => {
    startTransition(async () => {
      const result = await applyToMission(mission.id);
      if (result?.error) {
        setApplyError(result.error);
      } else {
        setApplied(true);
        setApplyError(null);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 cursor-pointer bg-black/75 backdrop-blur-sm"
        style={{ animation: "backdrop-in 0.15s ease-out forwards" }}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-night-500 bg-[#0e0e10] shadow-2xl"
        style={{ animation: "modal-in 0.18s ease-out forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-night-500" />
        </div>

        <div className="p-6 sm:p-8">
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-night-500 text-xl leading-none text-foreground/40 transition-colors duration-200 hover:border-night-400 hover:text-foreground"
            aria-label="Fermer"
          >
            ×
          </button>

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

          {/* Titre */}
          <h2 className="display mt-4 text-xl leading-snug tracking-tight sm:text-2xl">
            {mission.title}
          </h2>
          <p className="mt-1.5 text-sm text-foreground/40">{mission.companyName}</p>

          {/* Stats */}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="display tnum text-2xl">
              {formatEuros(mission.pricePerMeetingCents)}
              <span className="ml-1.5 text-sm font-normal tracking-normal text-foreground/40">
                / RDV validé
              </span>
            </p>
            <p className="tnum text-sm text-foreground/50">
              <span className="font-medium text-foreground">{mission.meetingsValidated}</span>
              /{mission.meetingsTarget} RDV validés
            </p>
            <p className="tnum text-sm text-foreground/50">
              <span className="font-medium text-ice-300">{formatEuros(remaining)}</span> restants
            </p>
            {mission.isBounty && mission.bountyDeadline && (
              <Countdown deadline={mission.bountyDeadline} />
            )}
          </div>

          {/* Barre de progression */}
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-night-600">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                mission.isBounty ? "bg-ember-500" : "bg-ice-500"
              }`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="mt-6 border-t border-night-600" />

          {/* Contenu en deux colonnes */}
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_220px]">

            {/* Gauche — brief cold call */}
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

              {mission.qualificationCriteria && (
                <section className="rounded-lg border border-night-600 bg-night-800 p-4">
                  <h3 className="micro flex items-center gap-1.5 text-foreground/40">
                    <ShieldCheck className="h-3 w-3" />
                    Ce qui compte comme RDV qualifié
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/75">
                    {mission.qualificationCriteria}
                  </p>
                  <p className="mt-2 text-xs text-foreground/35">
                    C&apos;est la base de validation : un RDV hors critères peut être contesté.
                  </p>
                </section>
              )}

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

            {/* Droite — CTA */}
            <div className="flex flex-col gap-3">
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
                    <dd>
                      <TierBadge tier={mission.minTier} size="sm" />
                    </dd>
                  </div>
                )}
              </dl>

              {/* Bouton selon le contexte */}
              {!profile && (
                <Link
                  href={`/connexion?next=/missions`}
                  className="block w-full cursor-pointer rounded-md bg-foreground px-4 py-3 text-center text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
                >
                  Se connecter pour postuler
                </Link>
              )}

              {profile?.role === "caller" && !applied && (
                <button
                  onClick={handleApply}
                  disabled={isPending}
                  className="w-full cursor-pointer rounded-md bg-foreground px-4 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85 disabled:cursor-default disabled:opacity-50"
                >
                  {isPending ? "Envoi…" : "Postuler à cette mission"}
                </button>
              )}

              {profile?.role === "caller" && applied && (
                <div className="flex items-center justify-center gap-2 rounded-md border border-ice-500/30 bg-ice-500/10 px-4 py-3 text-sm font-medium text-ice-300">
                  <ShieldCheck className="h-4 w-4" />
                  Candidature envoyée
                </div>
              )}

              {profile?.role === "caller" && applied && mission.bookingUrl && (
                <a
                  href={mission.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-md border border-night-500 px-4 py-3 text-sm font-medium text-foreground/70 transition-colors duration-200 hover:border-night-400 hover:text-foreground"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Agenda de l&apos;entreprise
                </a>
              )}

              {applyError && (
                <p className="text-center text-xs text-red-400">{applyError}</p>
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

              <div className="flex items-center justify-center gap-1.5 pt-1">
                <Lock className="h-3 w-3 text-foreground/25" />
                <p className="text-xs text-foreground/30">Budget séquestré en escrow</p>
              </div>

              <Link
                href={`/missions/${mission.id}`}
                className="mt-1 flex items-center justify-center gap-1 text-xs text-foreground/30 transition-colors duration-200 hover:text-foreground/60"
                onClick={onClose}
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
