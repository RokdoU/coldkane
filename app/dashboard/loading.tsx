// Squelette du dashboard caller : reproduit la grille réelle (KPIs, sections, table).
// Thème sombre, blocs animate-pulse aux mêmes dimensions que la vraie page.

import { Nav, Footer } from "@/components/nav";

export default function DashboardLoading() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14">
        {/* En-tête : titre + sous-titre */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="animate-pulse">
            <div className="h-8 w-56 rounded bg-night-700" />
            <div className="mt-3 h-4 w-64 rounded bg-night-700" />
          </div>
          <div className="h-10 w-52 animate-pulse rounded-md bg-night-700" />
        </div>

        {/* Carte rivalité */}
        <div className="mt-8 h-24 w-full animate-pulse rounded-xl border border-night-600 bg-night-800" />

        {/* KPIs — 3 cartes */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-night-600 bg-night-800 p-6"
            >
              <div className="h-9 w-9 rounded-lg bg-night-700" />
              <div className="mt-4 h-7 w-24 rounded bg-night-700" />
              <div className="mt-2 h-3 w-32 rounded bg-night-700" />
            </div>
          ))}
        </section>

        {/* Deux colonnes : déclarer un RDV + mes missions */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <section
              key={i}
              className="animate-pulse rounded-xl border border-night-600 bg-night-800 p-6"
            >
              <div className="h-5 w-44 rounded bg-night-700" />
              <div className="mt-3 h-3 w-full rounded bg-night-700" />
              <div className="mt-2 h-3 w-3/4 rounded bg-night-700" />
              <div className="mt-5 space-y-3">
                <div className="h-10 w-full rounded bg-night-700" />
                <div className="h-10 w-full rounded bg-night-700" />
              </div>
            </section>
          ))}
        </div>

        {/* Historique RDV : table */}
        <section className="mt-6 rounded-xl border border-night-600 bg-night-800 p-6">
          <div className="h-5 w-28 animate-pulse rounded bg-night-700" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center justify-between gap-4"
              >
                <div className="h-4 w-40 rounded bg-night-700" />
                <div className="h-4 w-32 rounded bg-night-700" />
                <div className="h-4 w-24 rounded bg-night-700" />
                <div className="h-4 w-16 rounded bg-night-700" />
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
