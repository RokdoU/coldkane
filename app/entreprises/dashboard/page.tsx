// Dashboard entreprise : missions, candidatures, RDV à valider/contester.
// Hérite du layout clair /entreprises (face sobre).

import type { Metadata } from "next";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase-server";
import { getCompanyDashboard } from "@/lib/dashboard-data";
import { formatEuros } from "@/lib/ranking";
import { acceptApplication, rejectApplication, companyValidateMeeting } from "@/lib/actions/missions";
import { DisputeForm } from "./dispute-form";
import { CloseMissionForm } from "./close-mission-form";
import { AddLeadsForm } from "./add-leads-form";
import { Lock, TrendingUp, Calendar, Users } from "@/components/icons";

export const metadata: Metadata = {
  title: "Dashboard entreprise",
};

const MISSION_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon — paiement en attente",
  funded: "Financée",
  active: "Active",
  completed: "Terminée",
  cancelled: "Annulée",
};

export default async function CompanyDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ funded?: string; canceled?: string }>;
}) {
  const profile = await getSessionProfile();
  const params = await searchParams;
  const data = await getCompanyDashboard(
    profile?.role === "company" ? profile.id : null,
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
      {data.demo && (
        <p className="mb-8 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Mode démo — données fictives. Les actions seront activées à la mise en production.
        </p>
      )}
      {params.funded && (
        <p className="mb-8 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Budget séquestré avec succès. Votre mission est en ligne — les callers
          peuvent maintenant postuler.
        </p>
      )}
      {params.canceled && (
        <p className="mb-8 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Paiement annulé. Votre mission est enregistrée en brouillon — vous
          pouvez relancer le paiement à tout moment.
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatEuros(data.spentCents)} consommés sur vos budgets séquestrés.
          </p>
        </div>
        <Link
          href="/entreprises/poster"
          className="cursor-pointer rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-700"
        >
          Nouvelle mission
        </Link>
      </div>

      {/* KPIs — vue d'ensemble */}
      <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Lock, label: "Budget consommé", value: formatEuros(data.spentCents) },
          {
            icon: TrendingUp,
            label: "Missions en cours",
            value: String(
              data.missions.filter((m) => m.status === "funded" || m.status === "active").length,
            ),
          },
          {
            icon: Calendar,
            label: "RDV à examiner",
            value: String(data.meetingsToReview.length),
            urgent: data.meetingsToReview.length > 0,
          },
          { icon: Users, label: "Candidatures", value: String(data.applications.length) },
        ].map(({ icon: Icon, label, value, urgent }) => (
          <div
            key={label}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <span
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                urgent
                  ? "bg-amber-50 text-amber-600"
                  : "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
              {value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </section>

      {/* RDV à examiner — l'action la plus urgente en premier */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">RDV à examiner</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sans action de votre part, un RDV est validé automatiquement 72h après
          l&apos;heure prévue. Valider déclenche le paiement du caller.
        </p>
        {data.meetingsToReview.length === 0 ? (
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Aucun RDV en attente d&apos;examen.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.meetingsToReview.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {m.prospectCompany}
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      par @{m.callerUsername}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {m.missionTitle} ·{" "}
                    {new Date(m.scheduledAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {m.status === "disputed" && (
                      <span className="ml-2 font-medium text-amber-600">
                        Contesté — arbitrage en cours
                      </span>
                    )}
                    {m.autoValidateAt && m.status === "booked" && (
                      <span className="ml-2 text-slate-400">
                        validation auto le{" "}
                        {new Date(m.autoValidateAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </p>
                </div>
                {m.status === "booked" && (
                  <div className="flex shrink-0 items-center gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await companyValidateMeeting(m.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="cursor-pointer rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-500"
                      >
                        Valider — RDV honoré
                      </button>
                    </form>
                    <DisputeForm meetingId={m.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Candidatures */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Candidatures</h2>
        {data.applications.length === 0 ? (
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Aucune candidature en attente.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.applications.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 p-4"
              >
                <div>
                  <Link
                    href={`/c/${a.callerUsername}`}
                    className="cursor-pointer font-medium text-slate-900 underline-offset-2 hover:underline"
                  >
                    @{a.callerUsername}
                  </Link>
                  <span className="ml-2 text-sm text-slate-500">
                    {a.callerPoints.toLocaleString("fr-FR")} pts en carrière · {a.missionTitle}
                  </span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await acceptApplication(a.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-700"
                    >
                      Accepter
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await rejectApplication(a.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="cursor-pointer rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:border-slate-400"
                    >
                      Refuser
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Missions */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Mes missions</h2>
        {data.missions.length === 0 ? (
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Aucune mission.{" "}
            <Link href="/entreprises/poster" className="cursor-pointer font-medium text-slate-900 underline">
              Déposez votre première mission
            </Link>
            .
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Mission</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Progression</th>
                  <th className="px-4 py-3 text-right font-medium">Prix/RDV</th>
                  <th className="px-4 py-3 text-right font-medium">Budget</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.missions.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="max-w-60 truncate px-4 py-3 font-medium">{m.title}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {MISSION_STATUS_LABELS[m.status] ?? m.status}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                      {m.meetingsValidated}/{m.meetingsTarget} RDV
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatEuros(m.pricePerMeetingCents)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatEuros(m.budgetCents)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <Link
                          href={`/missions/${m.id}`}
                          className="cursor-pointer text-xs font-medium text-slate-400 underline-offset-2 hover:text-slate-700 hover:underline"
                        >
                          Voir la fiche
                        </Link>
                        {["funded", "active"].includes(m.status) && (
                          /* Solde estimé : chaque RDV validé consomme exactement
                             price_per_meeting (release + commission) */
                          <CloseMissionForm
                            missionId={m.id}
                            remainingCents={
                              m.budgetCents - m.meetingsValidated * m.pricePerMeetingCents
                            }
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pool de leads (sourcing hybride) : comptes cibles que les callers réservent */}
      {data.missions.some((m) => ["funded", "active"].includes(m.status)) && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Pool de leads</h2>
          <p className="mt-1 text-sm text-slate-500">
            Optionnel : fournissez des comptes cibles. Vos callers en réservent un avant
            de l&apos;appeler — pas de doublon, vous gardez la main sur qui est approché.
          </p>
          <div className="mt-4 space-y-3">
            {data.missions
              .filter((m) => ["funded", "active"].includes(m.status))
              .map((m) => (
                <AddLeadsForm
                  key={m.id}
                  missionId={m.id}
                  missionTitle={m.title}
                  leadsTotal={m.leadsTotal}
                  leadsAvailable={m.leadsAvailable}
                />
              ))}
          </div>
        </section>
      )}
    </main>
  );
}
