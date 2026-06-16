// Programme ambassadeur / affiliation : attribution, gains des filleuls et
// commission cumulée DUE au parrain (rev-share AFFICHÉ, pas versé ici).
//
// La règle business vit dans lib/config.ts (REFERRAL : 5% des gains du filleul
// pendant ses 3 premiers mois). Le VERSEMENT effectif du rev-share est câblé
// ailleurs (flux financier de payout) ; ici on se contente de CALCULER et
// d'exposer les chiffres au dashboard.

import { REFERRAL } from "./config";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase";

// =====================================================
// Lien partageable
// =====================================================

// Le lien d'affiliation pointe sur la home avec le pseudo du parrain en query.
// `?ref=<username>` est l'attribution : un clic est tracké (RPC
// track_referral_click), une inscription pose profiles.referred_by au signup.
export function referralLink(username: string, origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/?ref=${encodeURIComponent(username)}`;
}

// =====================================================
// Dashboard ambassadeur
// =====================================================

export interface AmbassadorReferral {
  username: string;
  joinedAt: string; // arrivée du filleul (profiles.created_at)
  earnedCents: number; // gains validés cumulés du filleul (tous RDV validés)
  // gains du filleul réalisés dans sa fenêtre REFERRAL (les seuls commissionnés)
  windowEarnedCents: number;
}

export interface AmbassadorDashboard {
  demo: boolean;
  referrals: AmbassadorReferral[];
  referralsCount: number;
  clicksCount: number;
  generatedCents: number; // total des gains validés générés par les filleuls
  // commission cumulée DUE au parrain (REFERRAL.rate × gains en fenêtre)
  commissionDueCents: number;
}

// Données de démo cohérentes (isSupabaseConfigured false) : trois filleuls,
// des clics, et une commission alignée sur REFERRAL.rate appliqué aux gains
// supposés en fenêtre. Le mode démo montre la mécanique sans base.
function demoDashboard(): AmbassadorDashboard {
  const now = Date.now();
  const referrals: AmbassadorReferral[] = [
    {
      username: "karim_dial",
      joinedAt: new Date(now - 40 * 86_400_000).toISOString(),
      earnedCents: 51000,
      windowEarnedCents: 51000, // arrivé il y a 40j : tout est dans la fenêtre
    },
    {
      username: "lea.outbound",
      joinedAt: new Date(now - 18 * 86_400_000).toISOString(),
      earnedCents: 22950,
      windowEarnedCents: 22950,
    },
    {
      username: "tomdialer",
      joinedAt: new Date(now - 5 * 86_400_000).toISOString(),
      earnedCents: 7650,
      windowEarnedCents: 7650,
    },
  ];
  const generatedCents = referrals.reduce((s, r) => s + r.earnedCents, 0);
  const commissionDueCents = referrals.reduce(
    (s, r) => s + Math.round(r.windowEarnedCents * REFERRAL.rate),
    0,
  );
  return {
    demo: true,
    referrals,
    referralsCount: referrals.length,
    clicksCount: 47,
    generatedCents,
    commissionDueCents,
  };
}

// Borne haute de la fenêtre de commission d'un filleul : created_at + N mois.
function windowEnd(joinedAtIso: string): number {
  const d = new Date(joinedAtIso);
  d.setMonth(d.getMonth() + REFERRAL.months);
  return d.getTime();
}

export async function getAmbassadorDashboard(
  referrerProfileId: string | null,
): Promise<AmbassadorDashboard> {
  if (!isSupabaseConfigured() || !referrerProfileId) {
    return demoDashboard();
  }

  // Service role : lecture serveur des meetings des filleuls (hors RLS, le
  // parrain n'est pas partie au RDV) — même pattern que la route OG event et
  // app/missions/page.tsx. Aucune donnée prospect n'est exposée au client.
  const db = supabaseAdmin();

  // 1. Les filleuls de ce parrain (referred_by) + leur date d'arrivée.
  const { data: referralRows } = await db
    .from("profiles")
    .select("id, username, created_at")
    .eq("referred_by", referrerProfileId);

  const referralProfiles = referralRows ?? [];
  const referralIds = referralProfiles.map((r) => r.id as string);

  // 2. Les RDV validés de ces filleuls (payout + date de validation) pour
  //    calculer gains cumulés et gains en fenêtre de commission.
  const meetingsByCaller = new Map<
    string,
    { payoutCents: number; validatedAt: string }[]
  >();
  if (referralIds.length > 0) {
    const { data: meetingRows } = await db
      .from("meetings")
      .select("caller_id, payout_cents, validated_at")
      .in("caller_id", referralIds)
      .eq("status", "validated")
      .not("payout_cents", "is", null);

    for (const m of meetingRows ?? []) {
      const callerId = m.caller_id as string;
      const list = meetingsByCaller.get(callerId) ?? [];
      list.push({
        payoutCents: m.payout_cents as number,
        validatedAt: m.validated_at as string,
      });
      meetingsByCaller.set(callerId, list);
    }
  }

  const referrals: AmbassadorReferral[] = referralProfiles.map((r) => {
    const joinedAt = r.created_at as string;
    const end = windowEnd(joinedAt);
    const start = new Date(joinedAt).getTime();
    const meetings = meetingsByCaller.get(r.id as string) ?? [];

    let earnedCents = 0;
    let windowEarnedCents = 0;
    for (const m of meetings) {
      earnedCents += m.payoutCents;
      const t = new Date(m.validatedAt).getTime();
      // Commissionné seulement si validé dans la fenêtre [arrivée, +N mois].
      if (t >= start && t <= end) {
        windowEarnedCents += m.payoutCents;
      }
    }
    return {
      username: r.username as string,
      joinedAt,
      earnedCents,
      windowEarnedCents,
    };
  });

  // 3. Nombre de clics trackés sur le lien d'affiliation de ce parrain.
  //    referral_clicks est indexé par pseudo : on le résout d'abord.
  const { data: me } = await db
    .from("profiles")
    .select("username")
    .eq("id", referrerProfileId)
    .single();

  let clicksCount = 0;
  if (me?.username) {
    const { count } = await db
      .from("referral_clicks")
      .select("id", { count: "exact", head: true })
      .eq("referrer_username", me.username);
    clicksCount = count ?? 0;
  }

  const generatedCents = referrals.reduce((s, r) => s + r.earnedCents, 0);
  // Commission cumulée DUE = somme des (rate × gains en fenêtre) par filleul.
  const commissionDueCents = referrals.reduce(
    (s, r) => s + Math.round(r.windowEarnedCents * REFERRAL.rate),
    0,
  );

  return {
    demo: false,
    referrals: referrals.sort((a, b) => b.earnedCents - a.earnedCents),
    referralsCount: referrals.length,
    clicksCount,
    generatedCents,
    commissionDueCents,
  };
}
