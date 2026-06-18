// Squelette du profil public caller : en-tête profil, stats de saison, carrière.
// Thème sombre, blocs animate-pulse — largeur max-w-4xl comme la vraie page.

import { Nav, Footer } from "@/components/nav";

export default function CallerProfileLoading() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-14">
        {/* En-tête profil */}
        <section className="rounded-xl border border-night-600 bg-night-800 p-8">
          <div className="flex flex-wrap items-center gap-6">
            <div className="h-18 w-18 animate-pulse rounded-xl bg-night-700" />
            <div className="min-w-0 flex-1 animate-pulse space-y-3">
              <div className="h-8 w-48 rounded bg-night-700" />
              <div className="h-4 w-64 rounded bg-night-700" />
              <div className="h-3 w-56 rounded bg-night-700" />
            </div>
          </div>
          {/* Barre de progression vers le prochain tier */}
          <div className="mt-7 animate-pulse">
            <div className="flex justify-between">
              <div className="h-3 w-40 rounded bg-night-700" />
              <div className="h-3 w-24 rounded bg-night-700" />
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-night-600" />
          </div>
        </section>

        {/* Stats de saison — 4 cartes */}
        <section className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-night-600 bg-night-800 p-6"
            >
              <div className="h-9 w-9 rounded-lg bg-night-700" />
              <div className="mt-4 h-7 w-20 rounded bg-night-700" />
              <div className="mt-2 h-3 w-24 rounded bg-night-700" />
            </div>
          ))}
        </section>

        {/* Bloc partage */}
        <div className="mt-4 h-28 w-full animate-pulse rounded-xl border border-night-600 bg-night-800" />

        {/* Carrière */}
        <section className="mt-4 rounded-xl border border-night-600 bg-night-800 p-6">
          <div className="h-3 w-24 animate-pulse rounded bg-night-700" />
          <div className="mt-4 flex flex-wrap gap-10">
            <div className="h-6 w-40 animate-pulse rounded bg-night-700" />
            <div className="h-6 w-44 animate-pulse rounded bg-night-700" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
