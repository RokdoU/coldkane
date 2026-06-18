// Squelette des missions : en-tête + pill escrow + grille de cartes.
// Thème sombre, blocs animate-pulse.

import { Nav, Footer } from "@/components/nav";

export default function MissionsLoading() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14">
        {/* En-tête : titre + pill escrow */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="animate-pulse">
            <div className="h-8 w-44 rounded bg-night-700" />
            <div className="mt-3 h-4 w-80 rounded bg-night-700" />
          </div>
          <div className="h-10 w-56 animate-pulse rounded-lg bg-night-700" />
        </div>

        {/* Grille de cartes mission */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-night-600 bg-night-800 p-6"
            >
              {/* Badge + prix */}
              <div className="flex items-center justify-between">
                <div className="h-5 w-20 rounded-full bg-night-700" />
                <div className="h-6 w-16 rounded bg-night-700" />
              </div>
              {/* Titre */}
              <div className="mt-5 h-5 w-3/4 rounded bg-night-700" />
              <div className="mt-2 h-4 w-1/2 rounded bg-night-700" />
              {/* Description */}
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-night-700" />
                <div className="h-3 w-5/6 rounded bg-night-700" />
              </div>
              {/* Pied : stats + CTA */}
              <div className="mt-6 flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-night-700" />
                <div className="h-9 w-24 rounded-md bg-night-700" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
