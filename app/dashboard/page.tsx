// Dashboard caller : missions, déclaration de RDV, gains, payouts.

import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/nav";
import { getSessionProfile } from "@/lib/supabase-server";
import { getCallerDashboard } from "@/lib/dashboard-data";
import { getRivalInfo } from "@/lib/data";
import { formatEuros } from "@/lib/ranking";
import { Calendar, Check, Lock, TrendingUp } from "@/components/icons";
import { DeclareMeetingForm } from "./declare-meeting-form";
import { DemoBanner } from "@/components/demo-banner";
import { MeetingStatusBadge } from "@/components/meeting-status-badge";
import { RivalCard } from "@/components/rival-card";
import { ReferralCard } from "@/components/referral-card";
import { WinShareCard } from "@/components/win-share-card";
import { DisputeEvidenceForm } from "./dispute-evidence-form";
import { PitchVideoForm } from "@/components/pitch-video-form";
import { DegenStatCard } from "@/components/degen-stat-card";
import { LeadsBoard } from "@/components/leads-board";

export const metadata: Metadata = {
  title: "Mon dashboard",
  // Espace personnel connecté : hors index.
  robots: { index: false, follow: false },
};

export default async function CallerDashboardPage() {
  const profile = await getSessionProfile();
  const [data, rival] = await Promise.all([
    getCallerDashboard(profile?.id ?? null),
    getRivalInfo(profile?.username ?? null),
  ]);
  const activeAssignments = data.assignments.filter((a) => a.status === "active");
  // Dernier win partageable : le payout validé le plus récent (meetings triés du plus récent au plus ancien)
  const lastWin = data.meetings.find((m) => m.status === "validated" && m.payoutCents);
  // RDV en litige : le caller peut fournir une preuve avant la résolution auto
  const disputedMeetings = data.meetings.filter((m) => m.status === "disputed");

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14">
        {data.demo && <DemoBanner />}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-3xl tracking-tight">
              {profile ? `Salut, ${profile.username}` : "Mon dashboard"}
            </h1>
            <p className="mt-2 text-sm text-foreground/45">
              Tes missions, tes RDV, tes gains.
            </p>
          </div>
          {!data.hasStripeAccount && (
            <Link
              href="/dashboard/payouts"
              className="cursor-pointer rounded-md border border-ember-500/40 bg-ember-500/5 px-4 py-2 text-sm font-medium text-ember-400 transition-colors duration-200 hover:border-ember-500/70"
            >
              Configurer mes virements →
            </Link>
          )}
        </div>

        {/* Rivalité : une cible nommée, pas un chiffre abstrait */}
        {rival && (
          <div className="mt-8">
            <RivalCard rival={rival} />
          </div>
        )}

        {/* KPIs — flex degen : ton cash, ton activité, en gros */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DegenStatCard
            icon={TrendingUp}
            accent="ice"
            label="Gains validés"
            value={formatEuros(data.totalEarnedCents)}
            hint="versé sur ton compte sous 24h"
          />
          <DegenStatCard
            icon={Calendar}
            accent="ember"
            label="RDV en jeu"
            value={String(data.pendingMeetings)}
            hint="en attente de validation"
          />
          <DegenStatCard
            icon={Check}
            accent="legende"
            label="Missions actives"
            value={String(activeAssignments.length)}
            hint="terrain de chasse ouvert"
          />
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Déclarer un RDV */}
          <section className="rounded-xl border border-night-600 bg-night-800 p-6">
            <h2 className="display text-lg">Déclarer un RDV booké</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/45">
              L&apos;entreprise le valide (ou il est validé automatiquement 72h
              après l&apos;heure du RDV s&apos;il n&apos;est pas contesté).
              RDV validé = paiement + points.
            </p>
            {activeAssignments.length > 0 ? (
              <DeclareMeetingForm assignments={activeAssignments} />
            ) : (
              <p className="mt-5 rounded-md border border-night-600 bg-night-700 px-4 py-3 text-sm text-foreground/50">
                Aucune mission active.{" "}
                <Link href="/missions" className="cursor-pointer font-medium text-ice-400 hover:text-ice-300">
                  Prends une mission
                </Link>{" "}
                pour commencer à déclarer des RDV.
              </p>
            )}
          </section>

          {/* Mes missions */}
          <section className="rounded-xl border border-night-600 bg-night-800 p-6">
            <h2 className="display text-lg">Mes missions</h2>
            {data.assignments.length === 0 ? (
              <p className="mt-5 text-sm text-foreground/45">
                Aucune candidature pour l&apos;instant.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-night-600/70">
                {data.assignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.missionTitle}</p>
                      <p className="mt-0.5 text-xs text-foreground/40">
                        {a.companyName} · {formatEuros(a.pricePerMeetingCents)}/RDV
                      </p>
                      {a.status === "active" && a.bookingUrl && (
                        <a
                          href={a.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ice-400 transition-colors duration-200 hover:text-ice-300"
                        >
                          <Calendar className="h-3 w-3" />
                          Agenda de l&apos;entreprise
                        </a>
                      )}
                    </div>
                    <span
                      className={`micro shrink-0 rounded-full border px-2.5 py-1 ${
                        a.status === "active"
                          ? "border-ice-500/30 text-ice-300"
                          : a.status === "applied"
                            ? "border-night-500 text-foreground/45"
                            : "border-night-600 text-foreground/30"
                      }`}
                    >
                      {a.status === "active"
                        ? "Active"
                        : a.status === "applied"
                          ? "En attente"
                          : a.status === "rejected"
                            ? "Refusée"
                            : "Terminée"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Pool de leads des missions actives (sourcing hybride) */}
        <LeadsBoard leads={data.leads} />

        {/* Historique RDV */}
        <section className="mt-6 rounded-xl border border-night-600 bg-night-800 p-6">
          <h2 className="display text-lg">Mes RDV</h2>
          {data.meetings.length === 0 ? (
            <p className="mt-5 text-sm text-foreground/45">Aucun RDV déclaré.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="micro border-b border-night-600 text-foreground/35">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Prospect</th>
                    <th className="py-2 pr-4 font-medium">Mission</th>
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 text-right font-medium">Payout</th>
                    <th className="py-2 text-right font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-night-600/70">
                  {data.meetings.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3 pr-4 font-medium">{m.prospectCompany}</td>
                      <td className="max-w-50 truncate py-3 pr-4 text-foreground/50">
                        {m.missionTitle}
                      </td>
                      <td className="tnum py-3 pr-4 text-foreground/50">
                        {new Date(m.scheduledAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="tnum py-3 pr-4 text-right">
                        {m.payoutCents ? (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Lock className="h-3 w-3 text-foreground/30" />
                            {formatEuros(m.payoutCents)}
                          </span>
                        ) : (
                          <span className="text-foreground/30">—</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <MeetingStatusBadge status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* RDV en litige : fournir une preuve avant la résolution automatique */}
        {disputedMeetings.length > 0 && (
          <section className="mt-6 rounded-xl border border-night-600 bg-night-800 p-6">
            <h2 className="display text-lg">RDV contestés</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/45">
              Fournis une preuve avant l&apos;échéance du litige. Sans preuve, le
              RDV est annulé automatiquement.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {disputedMeetings.map((m) => (
                <DisputeEvidenceForm
                  key={m.id}
                  meetingId={m.id}
                  prospectCompany={m.prospectCompany}
                  reason={m.disputeReason}
                  existingEvidence={m.callerEvidence}
                />
              ))}
            </div>
          </section>
        )}

        {/* Partage du dernier win : la carte événement, prête à poster */}
        {lastWin && lastWin.payoutCents && (
          <div className="mt-6">
            <WinShareCard
              username={profile?.username ?? "toncall"}
              amountCents={lastWin.payoutCents}
              eventId={lastWin.id}
            />
          </div>
        )}

        {/* Parrainage + profil public */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ReferralCard username={profile?.username ?? "toncall"} />
          <div className="flex flex-col justify-between rounded-xl border border-night-600 bg-night-800 p-6">
            <div>
              <h2 className="display text-lg">Ton profil public</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/45">
                Ta carte joueur — rang, tier, stats vérifiées — s&apos;affiche
                automatiquement quand tu partages ton lien. C&apos;est ton CV
                vivant : colle-le dans ta bio LinkedIn.
              </p>
            </div>
            <Link
              href={profile ? `/c/${profile.username}` : "/c/sashaclose"}
              className="mt-4 inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-night-500 px-4 py-2.5 text-sm font-medium text-foreground/75 transition-colors duration-200 hover:border-night-400 hover:text-foreground"
            >
              Voir mon profil et le partager →
            </Link>
          </div>
        </div>

        {/* Vidéo de pitch : preuve sociale optionnelle sur le profil public.
            La plateforme n'héberge rien — juste un lien externe. */}
        <section className="mt-6 rounded-xl border border-night-600 bg-night-800 p-6">
          <h2 className="display text-lg">Ta vidéo de pitch</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/45">
            Optionnel. Colle le lien d&apos;une vidéo où tu te présentes
            (TikTok, Instagram ou YouTube) : elle apparaîtra sur ton profil
            public comme preuve sociale. On n&apos;héberge aucune vidéo, on
            renvoie simplement vers la tienne.
          </p>
          <PitchVideoForm currentUrl={data.pitchVideoUrl} />
        </section>
      </main>
      <Footer />
    </>
  );
}
