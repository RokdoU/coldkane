// Profil public vérifié : le CV vivant du caller — l'aimant n°1 du produit.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav, Footer } from "@/components/nav";
import { TierBadge } from "@/components/tier-badge";
import { getCallerByUsername } from "@/lib/data";
import { nextTierProgress, TIER_LABELS } from "@/lib/ranking";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const entry = await getCallerByUsername(username);
  if (!entry) return { title: "Profil introuvable" };
  return {
    title: `${entry.caller.username} — ${TIER_LABELS[entry.tier]} · rang #${entry.rank}`,
    description: `${entry.points} points, ${entry.meetingsValidated} RDV validés cette saison. Réputation vérifiée par escrow.`,
  };
}

export default async function CallerProfilePage({ params }: Props) {
  const { username } = await params;
  const entry = await getCallerByUsername(username);
  if (!entry) notFound();

  const { caller } = entry;
  const progress = nextTierProgress(entry.points);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        {/* En-tête profil */}
        <section className="rounded-3xl border border-night-600 bg-night-800 p-8">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-night-600 text-3xl font-black text-ice-300">
              {caller.fullName.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black">{caller.username}</h1>
                <TierBadge tier={entry.tier} />
                <span className="rounded-full bg-night-600 px-3 py-1 font-mono text-sm font-bold text-foreground/70">
                  #{entry.rank}
                </span>
              </div>
              {caller.headline && <p className="mt-1 text-foreground/60">{caller.headline}</p>}
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ice-400">
                ✓ Stats vérifiées par escrow — impossibles à truquer
              </p>
            </div>
          </div>

          {caller.bio && <p className="mt-6 text-sm text-foreground/70">{caller.bio}</p>}

          {/* Progression vers le tier suivant */}
          {progress.next && (
            <div className="mt-6">
              <div className="flex justify-between text-xs text-foreground/50">
                <span>
                  Prochain tier : <span className="font-bold capitalize">{TIER_LABELS[progress.next]}</span>
                </span>
                <span>{progress.remaining} pts restants</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-night-600">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-ice-500 to-ice-300"
                  style={{ width: `${Math.round(progress.progress * 100)}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Stats de saison */}
        <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            [entry.points.toLocaleString("fr-FR"), "Points saison"],
            [String(entry.meetingsValidated), "RDV validés"],
            [`${entry.bestStreak >= 5 ? "🔥 " : ""}${entry.bestStreak}`, "Meilleur streak"],
            [String(entry.noShows), "No-shows"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-night-600 bg-night-800 p-5 text-center">
              <p className="text-2xl font-black text-ice-300">{value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-foreground/40">{label}</p>
            </div>
          ))}
        </section>

        {/* Carrière (lifetime) */}
        <section className="mt-6 rounded-2xl border border-night-600 bg-night-800 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground/40">Carrière</h2>
          <div className="mt-3 flex flex-wrap gap-8">
            <p>
              <span className="text-xl font-black">{caller.lifetimePoints.toLocaleString("fr-FR")}</span>{" "}
              <span className="text-sm text-foreground/50">points cumulés</span>
            </p>
            <p>
              <span className="text-xl font-black">{caller.lifetimeMeetingsValidated}</span>{" "}
              <span className="text-sm text-foreground/50">RDV validés au total</span>
            </p>
          </div>
        </section>

        {/* Badges */}
        {caller.badges.length > 0 && (
          <section className="mt-6 rounded-2xl border border-night-600 bg-night-800 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground/40">Badges</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {caller.badges.map((b) => (
                <div
                  key={b.slug}
                  className="flex items-center gap-2 rounded-xl border border-night-600 bg-night-700 px-4 py-2"
                  title={b.description}
                >
                  <span className="text-xl">{b.icon}</span>
                  <span className="text-sm font-semibold">{b.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 text-center">
          <Link href="/leaderboard" className="text-sm font-semibold text-ice-400 hover:text-ice-300">
            ← Retour au classement
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
