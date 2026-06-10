import type { Metadata } from "next";
import Link from "next/link";
import { COMMISSION_RATE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Entreprises — RDV qualifiés, payés au résultat",
  description:
    "Déposez une mission, le budget est séquestré, vous ne payez que les RDV qualifiés qui ont réellement eu lieu.",
};

export default function EntreprisesPage() {
  return (
    <main>
      {/* Hero sobre */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Des RDV commerciaux qualifiés.
            <br />
            <span className="text-slate-500">Vous ne payez que le résultat.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Déposez votre mission, votre budget est placé sous séquestre. Nos
            commerciaux — classés et vérifiés sur leurs résultats réels — prospectent
            pour vous. Un paiement n&apos;est déclenché que lorsqu&apos;un RDV
            qualifié a effectivement eu lieu, preuve calendrier à l&apos;appui.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/entreprises/poster"
              className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              Déposer une mission
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Voir le classement des callers
            </Link>
          </div>
        </div>
      </section>

      {/* Garanties */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3">
          {[
            {
              title: "Zéro risque financier",
              text: "Pas d'abonnement, pas de fixe. Le budget est séquestré via Stripe et n'est débloqué qu'au RDV validé. Le solde non consommé vous est remboursé.",
            },
            {
              title: "Des commerciaux prouvés",
              text: "Chaque caller a un historique public : RDV réellement bookés, taux de présence, régularité. Vous choisissez sur des résultats vérifiés, pas sur un CV.",
            },
            {
              title: "Validation robuste",
              text: "Un RDV n'est compté que si le prospect était présent, preuve calendrier à l'appui. Les tentatives de fraude sont automatiquement détectées et sanctionnées.",
            },
          ].map((b) => (
            <div key={b.title}>
              <h3 className="font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fonctionnement */}
      <section id="fonctionnement" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold">Fonctionnement</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            ["Décrivez votre cible", "Secteur, persona, prix par RDV, objectif. 10 minutes."],
            ["Séquestrez le budget", "Paiement sécurisé Stripe. Les fonds restent bloqués jusqu'aux résultats."],
            ["Les callers prospectent", "Les meilleurs profils prennent votre mission et bookent dans votre calendrier."],
            ["Payez au RDV validé", `Chaque RDV honoré libère le paiement (commission de ${Math.round(COMMISSION_RATE * 100)}% incluse). Le reste vous revient.`],
          ].map(([title, text], i) => (
            <li key={title} className="rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-bold text-slate-400">Étape {i + 1}</p>
              <h3 className="mt-1 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-2xl bg-slate-900 px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-bold">Votre pipeline mérite mieux que des promesses.</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Première mission en ligne en 10 minutes. Vous gardez le contrôle du budget à tout moment.
          </p>
          <Link
            href="/entreprises/poster"
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Déposer une mission
          </Link>
        </div>
      </section>
    </main>
  );
}
