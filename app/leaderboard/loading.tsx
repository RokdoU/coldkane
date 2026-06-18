// Squelette du classement : reproduit kill-feed, podium, table du ladder, tiers.
// Thème sombre, blocs animate-pulse.

import { Nav, Footer } from "@/components/nav";

export default function LeaderboardLoading() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14">
        {/* En-tête : titre + bandeau "Légende" */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-night-700" />
            <div className="mt-3 h-4 w-56 rounded bg-night-700" />
          </div>
          <div className="h-10 w-80 animate-pulse rounded-lg bg-night-700" />
        </div>

        {/* Kill feed */}
        <div className="mt-6 h-14 w-full animate-pulse rounded-lg border border-night-600 bg-night-800" />

        {/* Podium : top 3 */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[20, 28, 16].map((h, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-night-600 bg-night-800 p-5"
            >
              <div className="mx-auto h-14 w-14 rounded-xl bg-night-700" />
              <div className="mx-auto mt-4 h-4 w-24 rounded bg-night-700" />
              <div className="mx-auto mt-2 h-3 w-16 rounded bg-night-700" />
              <div className={`mt-4 w-full rounded bg-night-700`} style={{ height: `${h}px` }} />
            </div>
          ))}
        </div>

        {/* Reste du ladder : lignes */}
        <div className="mt-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-4 rounded-lg border border-night-600 bg-night-800 px-4 py-3.5"
            >
              <div className="h-5 w-6 rounded bg-night-700" />
              <div className="h-9 w-9 rounded-lg bg-night-700" />
              <div className="h-4 w-40 rounded bg-night-700" />
              <div className="ml-auto h-4 w-20 rounded bg-night-700" />
            </div>
          ))}
        </div>

        {/* Tiers de la saison */}
        <section className="mt-10 rounded-xl border border-night-600 bg-night-800 p-6">
          <div className="h-3 w-40 animate-pulse rounded bg-night-700" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-night-600 p-3.5"
              >
                <div className="h-4 w-16 rounded bg-night-700" />
                <div className="mt-1 h-3 w-12 rounded bg-night-700" />
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
