import type { Metadata } from "next";
import { getSessionProfile } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { MissionForm } from "./mission-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Déposer une mission",
  description:
    "Publiez votre mission de cold calling, séquestrez le budget en escrow et recevez des RDV qualifiés payés uniquement au résultat.",
  // Espace transactionnel réservé aux entreprises connectées : hors index.
  robots: { index: false, follow: true },
};

export default async function PosterMissionPage() {
  const profile = await getSessionProfile();
  const needsAuth = isSupabaseConfigured() && profile?.role !== "company";

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold tracking-tight">Déposer une mission</h1>
      <p className="mt-2 text-slate-600">
        Décrivez votre cible, fixez votre prix par RDV. Le budget sera séquestré —
        vous ne payez que les RDV qui ont réellement lieu.
      </p>

      {needsAuth ? (
        <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="font-medium">Un compte entreprise est nécessaire.</p>
          <p className="mt-1 text-sm text-slate-500">
            Création en 2 minutes — aucun paiement avant le dépôt de votre première mission.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/inscription"
              className="cursor-pointer rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-700"
            >
              Créer un compte entreprise
            </Link>
            <Link
              href="/connexion?next=/entreprises/poster"
              className="cursor-pointer rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-slate-400"
            >
              Se connecter
            </Link>
          </div>
        </div>
      ) : (
        <MissionForm />
      )}
    </main>
  );
}
