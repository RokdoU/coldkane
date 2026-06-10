// Face entreprise : ambiance volontairement opposée à la face caller.
// Sobre, claire, rassurante — le hype attire les talents, le sérieux rassure les payeurs.

import Link from "next/link";
import { BRAND } from "@/lib/config";

export default function EntreprisesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-plex flex min-h-screen flex-1 flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/entreprises" className="cursor-pointer text-lg font-bold tracking-tight text-slate-900">
            {BRAND.name} <span className="font-normal text-slate-400">| Entreprises</span>
          </Link>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link
              href="/entreprises#fonctionnement"
              className="cursor-pointer rounded-md px-3 py-2 text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900"
            >
              Fonctionnement
            </Link>
            <Link
              href="/leaderboard"
              className="cursor-pointer rounded-md px-3 py-2 text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900"
            >
              Nos callers
            </Link>
            <Link
              href="/entreprises/poster"
              className="cut-sm cursor-pointer bg-slate-900 px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-slate-700"
            >
              Déposer une mission
            </Link>
          </div>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        {BRAND.name} — Paiement à la performance, escrow sécurisé via Stripe.
      </footer>
    </div>
  );
}
