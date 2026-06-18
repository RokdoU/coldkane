// Squelette du dashboard entreprise : thème CLAIR (slate sur blanc).
// Le header/footer viennent du layout /entreprises — on ne rend que le contenu.

export default function CompanyDashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
      {/* En-tête : titre + bouton */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-pulse">
          <div className="h-8 w-60 rounded bg-slate-100" />
          <div className="mt-2 h-4 w-72 rounded bg-slate-100" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded-md bg-slate-100" />
      </div>

      {/* KPIs — 4 cartes */}
      <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="h-9 w-9 rounded-xl bg-slate-100" />
            <div className="mt-3 h-7 w-16 rounded bg-slate-100" />
            <div className="mt-1.5 h-3 w-24 rounded bg-slate-100" />
          </div>
        ))}
      </section>

      {/* RDV à examiner + candidatures : deux listes empilées */}
      {Array.from({ length: 2 }).map((_, section) => (
        <section key={section} className="mt-10">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 p-4"
              >
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-slate-100" />
                  <div className="h-3 w-64 rounded bg-slate-100" />
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-24 rounded-md bg-slate-100" />
                  <div className="h-9 w-24 rounded-md bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Mes missions : table */}
      <section className="mt-10">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <div className="h-11 w-full animate-pulse bg-slate-50" />
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 px-4 py-3.5">
                <div className="h-4 w-48 rounded bg-slate-100" />
                <div className="ml-auto h-4 w-24 rounded bg-slate-100" />
                <div className="h-4 w-16 rounded bg-slate-100" />
                <div className="h-4 w-16 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
