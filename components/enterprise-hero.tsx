// Hero entreprise "innovant" : thème clair premium B2B (slate), carte bento à
// bordure en dégradé animé, grille pointillée subtile et flottement doux.
// CSS only (cf. keyframes globals.css), respecte prefers-reduced-motion.
// Inspiration : hero SaaS animé (21st.dev), réimplémenté aux tokens du projet.

import Link from "next/link";
import { ShieldCheck, TrendingUp, Lock } from "@/components/icons";

export function EnterpriseHero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200">
      {/* Grille pointillée + halo doux */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(15 23 42 / 0.06) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-gradient-to-br from-sky-200/40 to-indigo-200/30 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-20 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Colonne texte */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Paiement au résultat · budget séquestré via Stripe
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
            Le pipeline commercial où vous ne payez{" "}
            <span className="bg-gradient-to-r from-slate-900 via-indigo-600 to-sky-500 bg-clip-text text-transparent animate-gradient-pan">
              que ce qui a vraiment eu lieu.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Déposez une mission, votre budget est placé sous séquestre. Des
            commerciaux classés et vérifiés sur leurs résultats réels prospectent
            pour vous — un euro n&apos;est libéré qu&apos;au RDV qualifié honoré,
            preuve calendrier à l&apos;appui.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/entreprises/poster"
              className="group inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md"
            >
              Déposer une mission
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors duration-200 hover:border-slate-400"
            >
              Voir le classement des callers
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            Sans abonnement · sans engagement · solde non consommé remboursé
          </p>
        </div>

        {/* Colonne bento : carte à bordure dégradée animée + flottement */}
        <div className="relative animate-float-soft">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-400 via-sky-400 to-emerald-400 p-px animate-gradient-pan shadow-xl shadow-slate-900/5">
            <div className="rounded-2xl bg-white p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Mission #SDR-204</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <Lock className="h-3 w-3" />
                  Escrow sécurisé
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { icon: ShieldCheck, k: "Budget séquestré", v: "100%" },
                  { icon: TrendingUp, k: "RDV validés", v: "13 / 20" },
                  { icon: Lock, k: "Débloqué au résultat", v: "1 950 €" },
                  { icon: ShieldCheck, k: "Présence vérifiée", v: "92%" },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                    <s.icon className="h-4 w-4 text-slate-400" />
                    <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">{s.v}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{s.k}</p>
                  </div>
                ))}
              </div>

              {/* Barre de progression de la mission */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Avancement</span>
                  <span className="font-medium text-slate-700">65%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                    style={{ width: "65%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
