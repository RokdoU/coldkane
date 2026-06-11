// Dashboard caller : missions, déclaration de RDV, gains, payouts.

import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/nav";
import { getSessionProfile } from "@/lib/supabase-server";
import { getCallerDashboard } from "@/lib/dashboard-data";
import { formatEuros } from "@/lib/ranking";
import { Calendar, Check, Lock, TrendingUp } from "@/components/icons";
import { DeclareMeetingForm } from "./declare-meeting-form";
import { DemoBanner } from "@/components/demo-banner";
import { MeetingStatusBadge } from "@/components/meeting-status-badge";

export const metadata: Metadata = {
  title: "Mon dashboard",
};

export default async function CallerDashboardPage() {
  const profile = await getSessionProfile();
  const data = await getCallerDashboard(profile?.id ?? null);
  const activeAssignments = data.assignments.filter((a) => a.status === "active");

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

        {/* KPIs */}
        <section className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-night-600 bg-night-600">
          {[
            { icon: TrendingUp, value: formatEuros(data.totalEarnedCents), label: "Gains validés" },
            { icon: Calendar, value: String(data.pendingMeetings), label: "RDV en attente" },
            { icon: Check, value: String(activeAssignments.length), label: "Missions actives" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="bg-night-800 p-5 text-center">
              <Icon className="mx-auto h-4 w-4 text-foreground/35" />
              <p className="display tnum mt-2.5 text-xl">{value}</p>
              <p className="micro mt-1.5 text-foreground/35">{label}</p>
            </div>
          ))}
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
      </main>
      <Footer />
    </>
  );
}
