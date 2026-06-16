// Espace ambassadeur : le caller partage son lien d'affiliation, suit ses
// filleuls, leurs gains et la commission cumulée qui lui est DUE (rev-share
// AFFICHÉ — le versement effectif est câblé hors de cette page).

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav, Footer } from "@/components/nav";
import { DemoBanner } from "@/components/demo-banner";
import { AmbassadorLink } from "@/components/ambassador-link";
import { AmbassadorContentKit } from "@/components/ambassador-content-kit";
import { getSessionProfile } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getAmbassadorDashboard } from "@/lib/affiliate";
import { formatEuros } from "@/lib/ranking";
import { REFERRAL } from "@/lib/config";
import { Sparkle, TrendingUp, Users } from "@/components/icons";

export const metadata: Metadata = {
  title: "Espace ambassadeur",
};

export default async function AmbassadorPage() {
  const profile = await getSessionProfile();

  // Hors démo : page réservée à un caller connecté.
  if (isSupabaseConfigured() && (!profile || profile.role !== "caller")) {
    redirect("/connexion?next=/ambassadeur");
  }

  // Pseudo affiché : le vrai en prod, un pseudo de démo sinon.
  const username = profile?.username ?? "sashaclose";
  const data = await getAmbassadorDashboard(profile?.id ?? null);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-14">
        {data.demo && <DemoBanner />}

        <div>
          <h1 className="display text-3xl tracking-tight">Espace ambassadeur</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/45">
            Partage ton lien. Chaque caller qui te rejoint devient ton filleul :
            tu touches{" "}
            <span className="font-medium text-ice-300">
              {Math.round(REFERRAL.rate * 100)}% de ses gains
            </span>{" "}
            pendant ses {REFERRAL.months} premiers mois. Tout est tracké, tout
            est vérifié par escrow.
          </p>
        </div>

        {/* KPIs : filleuls, gains générés, commission cumulée due */}
        <section className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-night-600 bg-night-600 sm:grid-cols-4">
          {[
            { icon: Users, value: String(data.referralsCount), label: "Filleuls" },
            { icon: TrendingUp, value: String(data.clicksCount), label: "Clics trackés" },
            {
              icon: TrendingUp,
              value: formatEuros(data.generatedCents),
              label: "Gains générés",
            },
            {
              icon: Sparkle,
              value: formatEuros(data.commissionDueCents),
              label: "Commission due",
              accent: true,
            },
          ].map(({ icon: Icon, value, label, accent }) => (
            <div key={label} className="bg-night-800 p-5 text-center">
              <Icon className={`mx-auto h-4 w-4 ${accent ? "text-ice-400" : "text-foreground/35"}`} />
              <p className={`display tnum mt-2.5 text-xl ${accent ? "text-ice-300" : ""}`}>
                {value}
              </p>
              <p className="micro mt-1.5 text-foreground/35">{label}</p>
            </div>
          ))}
        </section>

        <p className="mt-3 text-xs leading-relaxed text-foreground/35">
          La commission due est calculée en continu sur les gains validés de tes
          filleuls dans leur fenêtre de {REFERRAL.months} mois. Elle est versée
          séparément — ce chiffre est ton cumul à recevoir.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Lien d'affiliation + partage */}
          <section className="rounded-xl border border-night-600 bg-night-800 p-6">
            <h2 className="display flex items-center gap-2 text-lg">
              <Users className="h-4 w-4 text-ice-400" />
              Ton lien d&apos;affiliation
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/45">
              Colle-le partout. Quand quelqu&apos;un s&apos;inscrit via ce lien,
              il devient ton filleul automatiquement.
            </p>
            <div className="mt-4">
              <AmbassadorLink username={username} />
            </div>
          </section>

          {/* Carte OG partageable */}
          <section className="rounded-xl border border-night-600 bg-night-800 p-6">
            <h2 className="display text-lg">Ta carte ambassadeur</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/45">
              Cette carte s&apos;affiche quand tu colles ton lien sur X ou
              LinkedIn. Télécharge-la pour la poster directement.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/og/ambassador/${username}`}
              alt={`Carte ambassadeur de @${username}`}
              width={1200}
              height={630}
              className="mt-4 w-full rounded-lg border border-night-600"
            />
          </section>
        </div>

        {/* Kit de contenu : accroches prêtes à poster */}
        <section className="mt-6 rounded-xl border border-night-600 bg-night-800 p-6">
          <h2 className="display text-lg">Kit de contenu</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/45">
            Des posts prêts à publier, déjà au bon ton. Chacun embarque ton lien
            d&apos;affiliation.
          </p>
          <AmbassadorContentKit username={username} />
        </section>

        {/* Liste des filleuls */}
        <section className="mt-6 rounded-xl border border-night-600 bg-night-800 p-6">
          <h2 className="display text-lg">Tes filleuls</h2>
          {data.referrals.length === 0 ? (
            <p className="mt-5 text-sm text-foreground/45">
              Aucun filleul pour l&apos;instant. Partage ton lien pour
              commencer.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="micro border-b border-night-600 text-foreground/35">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Filleul</th>
                    <th className="py-2 pr-4 font-medium">Arrivé le</th>
                    <th className="py-2 pr-4 text-right font-medium">Gains validés</th>
                    <th className="py-2 text-right font-medium">Ta commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-night-600/70">
                  {data.referrals.map((r) => (
                    <tr key={r.username}>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/c/${r.username}`}
                          className="cursor-pointer font-medium text-foreground/80 transition-colors duration-200 hover:text-ice-300"
                        >
                          {r.username}
                        </Link>
                      </td>
                      <td className="tnum py-3 pr-4 text-foreground/50">
                        {new Date(r.joinedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="tnum py-3 pr-4 text-right text-foreground/70">
                        {formatEuros(r.earnedCents)}
                      </td>
                      <td className="tnum py-3 text-right font-medium text-ice-300">
                        {formatEuros(Math.round(r.windowEarnedCents * REFERRAL.rate))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-10 text-center">
          <Link
            href="/dashboard"
            className="cursor-pointer text-sm font-medium text-ice-400 transition-colors duration-200 hover:text-ice-300"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
