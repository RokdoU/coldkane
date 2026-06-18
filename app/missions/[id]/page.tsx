import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav, Footer } from "@/components/nav";
import { TierBadge } from "@/components/tier-badge";
import { Countdown } from "@/components/countdown";
import { getMissionById } from "@/lib/data";
import { getSessionProfile, supabaseServer } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { applyToMission } from "@/lib/actions/missions";
import { formatEuros, TIER_LABELS } from "@/lib/ranking";
import { ArrowRight, Calendar, Crosshair, Lock, Phone, ShieldCheck, Zap } from "@/components/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const mission = await getMissionById(id);
  if (!mission) return { title: "Mission introuvable" };
  // Le titre passe par le template du layout (« … · ColdKane »), pas besoin
  // de suffixer ici.
  const description = mission.description.slice(0, 160);
  return {
    title: mission.title,
    description,
    alternates: { canonical: `/missions/${id}` },
    openGraph: {
      title: mission.title,
      description,
    },
  };
}

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [mission, profile] = await Promise.all([getMissionById(id), getSessionProfile()]);

  if (!mission) notFound();

  const progress = Math.min(mission.meetingsValidated / mission.meetingsTarget, 1);
  const remaining = mission.budgetCents - mission.meetingsValidated * mission.pricePerMeetingCents;

  let hasApplied = false;
  if (profile?.role === "caller" && isSupabaseConfigured()) {
    const db = await supabaseServer();
    const { data } = await db
      .from("assignments")
      .select("id")
      .eq("mission_id", id)
      .eq("caller_id", profile.id)
      .maybeSingle();
    hasApplied = !!data;
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 lg:py-14">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-foreground/40">
          <Link href="/missions" className="transition-colors duration-200 hover:text-foreground/70">
            Missions
          </Link>
          <ArrowRight className="h-3 w-3" />
          <span className="truncate text-foreground/70">{mission.sector}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-wrap items-start gap-3">
          {mission.isBounty && (
            <span className="micro flex items-center gap-1 rounded-full border border-ember-500/40 bg-ember-500/10 px-3 py-1 text-ember-400">
              <Zap className="h-2.5 w-2.5" />
              Bounty
            </span>
          )}
          <span className="micro rounded-full border border-night-500 px-3 py-1 text-foreground/40">
            {mission.sector}
          </span>
          {mission.minTier && (
            <TierBadge tier={mission.minTier} />
          )}
        </div>

        <h1 className="display mt-4 text-2xl leading-snug tracking-tight sm:text-3xl">
          {mission.title}
        </h1>
        <p className="mt-2 text-sm text-foreground/40">
          {mission.companyName} · publié le{" "}
          {new Date(mission.createdAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        {/* Progress bar */}
        <div className="mt-6 rounded-xl border border-night-600 bg-night-800 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="display tnum text-2xl">
                  {formatEuros(mission.pricePerMeetingCents)}
                  <span className="ml-1.5 text-sm font-normal tracking-normal text-foreground/40">/ RDV validé</span>
                </p>
              </div>
              <div className="h-8 w-px bg-night-600" />
              <div>
                <p className="tnum text-sm font-medium">
                  {mission.meetingsValidated}
                  <span className="text-foreground/40">/{mission.meetingsTarget} RDV</span>
                </p>
                <p className="mt-0.5 text-xs text-foreground/40">validés sur cet objectif</p>
              </div>
              <div className="h-8 w-px bg-night-600 hidden sm:block" />
              <div className="hidden sm:block">
                <p className="tnum text-sm font-medium">{formatEuros(Math.max(remaining, 0))}</p>
                <p className="mt-0.5 text-xs text-foreground/40">budget restant en escrow</p>
              </div>
            </div>
            {mission.isBounty && mission.bountyDeadline && (
              <Countdown deadline={mission.bountyDeadline} />
            )}
          </div>
          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-night-600">
              <div
                className={`h-full rounded-full transition-all duration-500 ${mission.isBounty ? "bg-ember-500" : "bg-ice-500"}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">

          {/* LEFT — infos cold call */}
          <div className="space-y-8">

            {/* Qui appeler */}
            {mission.targetPersona && (
              <section>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Crosshair className="h-4 w-4 text-ice-400" />
                  Qui appeler
                </h2>
                <p className="mt-3 leading-relaxed text-foreground/70">{mission.targetPersona}</p>
              </section>
            )}

            {/* Type de RDV */}
            {mission.meetingType && (
              <section>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Calendar className="h-4 w-4 text-ice-400" />
                  Type de RDV attendu
                </h2>
                <p className="mt-3 leading-relaxed text-foreground/70">{mission.meetingType}</p>
              </section>
            )}

            {/* Contexte */}
            <section>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Phone className="h-4 w-4 text-ice-400" />
                Contexte de la mission
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/70">
                {mission.description}
              </p>
            </section>

            {/* Notes de pitch */}
            {mission.pitchNotes && (
              <section className="rounded-xl border border-ice-500/20 bg-ice-500/5 p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ice-300">
                  <ShieldCheck className="h-4 w-4" />
                  Notes de pitch — réservées aux callers acceptés
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/65">
                  {mission.pitchNotes}
                </p>
              </section>
            )}

            {/* Garantie escrow */}
            <div className="flex items-start gap-3 rounded-xl border border-night-600 p-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-foreground/30" />
              <p className="text-sm leading-relaxed text-foreground/45">
                Le budget de cette mission est séquestré en escrow avant que tu ne commences à travailler.
                Chaque RDV validé déclenche un paiement automatique sur ton compte — impossible à annuler rétroactivement.
              </p>
            </div>
          </div>

          {/* RIGHT — sidebar CTA */}
          <aside className="lg:sticky lg:top-8 h-fit">
            <div className={`rounded-xl border p-6 ${mission.isBounty ? "border-ember-500/30 bg-night-800" : "border-night-500 bg-night-800"}`}>
              <p className="display tnum text-3xl">
                {formatEuros(mission.pricePerMeetingCents)}
              </p>
              <p className="mt-1 text-sm text-foreground/40">par RDV validé par l&apos;entreprise</p>

              <dl className="mt-5 space-y-2.5 border-t border-night-600 pt-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-foreground/50">Budget total</dt>
                  <dd className="tnum font-medium">{formatEuros(mission.budgetCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground/50">RDV validés</dt>
                  <dd className="tnum font-medium">
                    {mission.meetingsValidated}/{mission.meetingsTarget}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground/50">Restant en escrow</dt>
                  <dd className="tnum font-medium text-ice-300">
                    {formatEuros(Math.max(remaining, 0))}
                  </dd>
                </div>
                {mission.minTier && (
                  <div className="flex justify-between">
                    <dt className="text-foreground/50">Tier minimum</dt>
                    <dd className="font-medium">{TIER_LABELS[mission.minTier]}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-5 space-y-3">
                {!profile && (
                  <Link
                    href={`/connexion?next=/missions/${id}`}
                    className="block w-full cursor-pointer rounded-md bg-foreground px-4 py-3 text-center text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
                  >
                    Se connecter pour postuler
                  </Link>
                )}

                {profile?.role === "caller" && !hasApplied && (
                  <form
                    action={async () => {
                      "use server";
                      await applyToMission(id);
                    }}
                  >
                    <button
                      type="submit"
                      className="w-full cursor-pointer rounded-md bg-foreground px-4 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
                    >
                      Postuler à cette mission
                    </button>
                  </form>
                )}

                {profile?.role === "caller" && hasApplied && (
                  <div className="flex items-center justify-center gap-2 rounded-md border border-ice-500/30 bg-ice-500/10 px-4 py-3 text-sm font-medium text-ice-300">
                    <ShieldCheck className="h-4 w-4" />
                    Candidature envoyée
                  </div>
                )}

                {profile?.role === "company" && (
                  <Link
                    href="/entreprises/dashboard"
                    className="flex items-center justify-center gap-2 rounded-md border border-night-500 px-4 py-3 text-sm font-medium text-foreground/70 transition-colors duration-200 hover:border-night-400 hover:text-foreground"
                  >
                    Gérer mes missions
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}

                {mission.isBounty && mission.bountyDeadline && (
                  <p className="text-center text-xs text-foreground/35">
                    Bounty — fenêtre courte, prime majorée
                  </p>
                )}
              </div>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-foreground/30">
              <Lock className="h-3 w-3" />
              Paiement sécurisé par escrow — garanti avant ton premier appel
            </p>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
