// Profil public vérifié : la carte de joueur du caller — l'aimant n°1 du produit.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav, Footer } from "@/components/nav";
import { TierBadge } from "@/components/tier-badge";
import { getCallerByUsername } from "@/lib/data";
import { nextTierProgress, TIER_LABELS } from "@/lib/ranking";
import { Ban, Calendar, Flame, Medal, ShieldCheck, TrendingUp } from "@/components/icons";

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
        {/* Carte joueur */}
        <section className="cut bg-grid relative overflow-hidden border border-night-600 bg-night-800 p-8">
          <p className="display pointer-events-none absolute -right-4 -top-7 select-none text-[9rem] leading-none text-night-700">
            {String(entry.rank).padStart(2, "0")}
          </p>
          <div className="relative flex flex-wrap items-center gap-6">
            <span className="cut display flex h-20 w-20 items-center justify-center bg-ice-400/10 text-4xl text-ice-300">
              {caller.fullName.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="display text-3xl tracking-wide">{caller.username}</h1>
                <TierBadge tier={entry.tier} />
              </div>
              {caller.headline && <p className="mt-1.5 text-foreground/60">{caller.headline}</p>}
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-ice-400">
                <ShieldCheck className="h-4 w-4" />
                Stats vérifiées par escrow — impossibles à truquer
              </p>
            </div>
          </div>

          {caller.bio && <p className="relative mt-6 text-sm text-foreground/70">{caller.bio}</p>}

          {progress.next && (
            <div className="relative mt-6">
              <div className="flex justify-between text-xs text-foreground/50">
                <span>
                  Prochain tier :{" "}
                  <span className="display tracking-wider text-foreground/80">
                    {TIER_LABELS[progress.next]}
                  </span>
                </span>
                <span className="display">{progress.remaining} pts restants</span>
              </div>
              <div className="mt-2 h-2 bg-night-600">
                <div
                  className="h-full bg-gradient-to-r from-ice-500 to-ice-300"
                  style={{ width: `${Math.round(progress.progress * 100)}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Stats de saison */}
        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: TrendingUp, value: entry.points.toLocaleString("fr-FR"), label: "Points saison" },
            { icon: Calendar, value: String(entry.meetingsValidated), label: "RDV validés" },
            { icon: Flame, value: String(entry.bestStreak), label: "Meilleur streak", hot: entry.bestStreak >= 5 },
            { icon: Ban, value: String(entry.noShows), label: "No-shows" },
          ].map(({ icon: Icon, value, label, hot }) => (
            <div key={label} className="cut border border-night-600 bg-night-800 p-5 text-center">
              <Icon className={`mx-auto h-4 w-4 ${hot ? "text-ember-400" : "text-ice-400"}`} />
              <p className="display mt-2 text-2xl text-ice-300">{value}</p>
              <p className="display mt-1.5 text-[10px] tracking-[0.2em] text-foreground/40">{label}</p>
            </div>
          ))}
        </section>

        {/* Carrière */}
        <section className="cut mt-4 border border-night-600 bg-night-800 p-6">
          <h2 className="display text-xs tracking-[0.2em] text-foreground/40">Carrière</h2>
          <div className="mt-3 flex flex-wrap gap-10">
            <p>
              <span className="display text-2xl">{caller.lifetimePoints.toLocaleString("fr-FR")}</span>{" "}
              <span className="text-sm text-foreground/50">points cumulés</span>
            </p>
            <p>
              <span className="display text-2xl">{caller.lifetimeMeetingsValidated}</span>{" "}
              <span className="text-sm text-foreground/50">RDV validés au total</span>
            </p>
          </div>
        </section>

        {/* Badges */}
        {caller.badges.length > 0 && (
          <section className="cut mt-4 border border-night-600 bg-night-800 p-6">
            <h2 className="display text-xs tracking-[0.2em] text-foreground/40">Badges</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {caller.badges.map((b) => (
                <div
                  key={b.slug}
                  className="cut-sm flex items-center gap-2 border border-night-500 bg-night-700 px-4 py-2"
                  title={b.description}
                >
                  <Medal className="h-4 w-4 text-tier-or" />
                  <span className="text-sm font-semibold">{b.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/leaderboard"
            className="cursor-pointer text-sm font-semibold text-ice-400 transition-colors duration-200 hover:text-ice-300"
          >
            ← Retour au classement
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
