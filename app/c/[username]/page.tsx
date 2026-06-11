// Profil public vérifié : le CV vivant du caller — l'aimant n°1 du produit.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav, Footer } from "@/components/nav";
import { TierBadge } from "@/components/tier-badge";
import { ShareKit } from "@/components/share-kit";
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
  const title = `${entry.caller.username} — ${TIER_LABELS[entry.tier]} · rang #${entry.rank}`;
  const description = `${entry.points} points, ${entry.meetingsValidated} RDV validés cette saison. Réputation vérifiée par escrow.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `/api/og/${username}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/${username}`],
    },
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
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-14">
        {/* En-tête profil */}
        <section className="relative overflow-hidden rounded-xl border border-night-600 bg-night-800 p-8">
          <p className="display tnum pointer-events-none absolute -right-2 -top-9 select-none text-[8.5rem] leading-none text-night-700">
            {String(entry.rank).padStart(2, "0")}
          </p>
          <div className="relative flex flex-wrap items-center gap-6">
            <span className="display flex h-18 w-18 items-center justify-center rounded-xl bg-night-600 text-3xl text-ice-300">
              {caller.fullName.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="display text-3xl tracking-tight">{caller.username}</h1>
                <TierBadge tier={entry.tier} />
              </div>
              {caller.headline && <p className="mt-1.5 text-foreground/55">{caller.headline}</p>}
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ice-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Stats vérifiées par escrow — impossibles à truquer
              </p>
            </div>
          </div>

          {caller.bio && (
            <p className="relative mt-6 text-sm leading-relaxed text-foreground/65">{caller.bio}</p>
          )}

          {progress.next && (
            <div className="relative mt-7">
              <div className="flex justify-between text-xs text-foreground/45">
                <span>
                  Prochain tier :{" "}
                  <span className="font-medium text-foreground/75">{TIER_LABELS[progress.next]}</span>
                </span>
                <span className="tnum">{progress.remaining} pts restants</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-night-600">
                <div
                  className="h-full rounded-full bg-ice-400"
                  style={{ width: `${Math.round(progress.progress * 100)}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Stats de saison */}
        <section className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-night-600 bg-night-600 sm:grid-cols-4">
          {[
            { icon: TrendingUp, value: entry.points.toLocaleString("fr-FR"), label: "Points saison" },
            { icon: Calendar, value: String(entry.meetingsValidated), label: "RDV validés" },
            { icon: Flame, value: String(entry.bestStreak), label: "Meilleur streak", hot: entry.bestStreak >= 5 },
            { icon: Ban, value: String(entry.noShows), label: "No-shows" },
          ].map(({ icon: Icon, value, label, hot }) => (
            <div key={label} className="bg-night-800 p-5 text-center">
              <Icon className={`mx-auto h-4 w-4 ${hot ? "text-ember-400" : "text-foreground/35"}`} />
              <p className="display tnum mt-2.5 text-2xl">{value}</p>
              <p className="micro mt-1.5 text-foreground/35">{label}</p>
            </div>
          ))}
        </section>

        {/* Partage */}
        <div className="mt-4">
          <ShareKit
            username={caller.username}
            rank={entry.rank}
            tierLabel={TIER_LABELS[entry.tier]}
            meetingsValidated={entry.meetingsValidated}
          />
        </div>

        {/* Carrière */}
        <section className="mt-4 rounded-xl border border-night-600 bg-night-800 p-6">
          <h2 className="micro text-foreground/40">Carrière</h2>
          <div className="mt-3 flex flex-wrap gap-10">
            <p>
              <span className="display tnum text-xl">
                {caller.lifetimePoints.toLocaleString("fr-FR")}
              </span>{" "}
              <span className="text-sm text-foreground/45">points cumulés</span>
            </p>
            <p>
              <span className="display tnum text-xl">{caller.lifetimeMeetingsValidated}</span>{" "}
              <span className="text-sm text-foreground/45">RDV validés au total</span>
            </p>
          </div>
        </section>

        {/* Badges */}
        {caller.badges.length > 0 && (
          <section className="mt-4 rounded-xl border border-night-600 bg-night-800 p-6">
            <h2 className="micro text-foreground/40">Badges</h2>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {caller.badges.map((b) => (
                <div
                  key={b.slug}
                  className="flex items-center gap-2 rounded-lg border border-night-600 px-3.5 py-2"
                  title={b.description}
                >
                  <Medal className="h-3.5 w-3.5 text-tier-or" />
                  <span className="text-sm font-medium">{b.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/leaderboard"
            className="cursor-pointer text-sm font-medium text-ice-400 transition-colors duration-200 hover:text-ice-300"
          >
            ← Retour au classement
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
