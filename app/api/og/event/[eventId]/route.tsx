// Cartes événementielles partageables, adossées à la base : l'eventId est
// l'id d'un RDV validé (carte payout) ou d'un badge décerné (carte badge).
// L'événement n'existe pas → 404. La carte est donc elle-même vérifiable :
// l'URL fonctionne = l'événement est réel. Aucune donnée prospect n'est lue.

import { ImageResponse } from "next/og";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { formatEuros } from "@/lib/ranking";

export const runtime = "edge";

const ICE = "#6ec3d4";
const GOLD = "#cfa84e";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface EventCard {
  kicker: string; // le type d'événement, en sur-titre
  headline: string; // le win, en très gros
  username: string;
  accent: string;
}

// Résout l'eventId en événement réel : RDV validé d'abord, badge ensuite.
async function lookupEvent(eventId: string): Promise<EventCard | null> {
  const db = supabaseAdmin();

  const { data: meeting } = await db
    .from("meetings")
    .select("caller_id, payout_cents, status")
    .eq("id", eventId)
    .eq("status", "validated")
    .maybeSingle();
  if (meeting?.payout_cents) {
    const { data: profile } = await db
      .from("profiles")
      .select("username")
      .eq("id", meeting.caller_id)
      .single();
    if (!profile) return null;
    return {
      kicker: "Payout encaissé",
      headline: `+${formatEuros(meeting.payout_cents)}`,
      username: profile.username,
      accent: ICE,
    };
  }

  const { data: awarded } = await db
    .from("caller_badges")
    .select("caller_id, badges!inner(label)")
    .eq("id", eventId)
    .maybeSingle();
  if (awarded) {
    const { data: profile } = await db
      .from("profiles")
      .select("username")
      .eq("id", awarded.caller_id)
      .single();
    if (!profile) return null;
    return {
      kicker: "Badge débloqué",
      headline: (awarded.badges as unknown as { label: string }).label,
      username: profile.username,
      accent: GOLD,
    };
  }

  return null;
}

// Carte neutre : uniquement en mode démo (rien de réel à prouver)
function neutralCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0b",
          color: "#ededef",
          fontSize: 48,
        }}
      >
        ColdKane
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await ctx.params;

  // Mode démo : pas de base à interroger, carte neutre (le site entier est fictif)
  if (!isSupabaseConfigured()) return neutralCard();

  const card = UUID_RE.test(eventId) ? await lookupEvent(eventId) : null;
  if (!card) {
    return new Response("événement introuvable", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0b",
          color: "#ededef",
          padding: 64,
          position: "relative",
        }}
      >
        {/* Halo discret dans la couleur de l'événement */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: 300,
            width: 600,
            height: 500,
            borderRadius: 999,
            background: card.accent,
            opacity: 0.07,
            filter: "blur(80px)",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "rgba(110, 195, 212, 0.12)",
              color: "#6ec3d4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            C
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>
            ColdKane
          </div>
        </div>

        {/* L'événement */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 6,
              color: card.accent,
            }}
          >
            {card.kicker}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 120,
              fontWeight: 700,
              lineHeight: 1.05,
              textAlign: "center",
            }}
          >
            {card.headline}
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "rgba(237,237,239,0.55)" }}>
            @{card.username}
          </div>
        </div>

        {/* Footer : la preuve, toujours — et cette URL est elle-même la preuve */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#6ec3d4",
            }}
          />
          <div style={{ display: "flex", fontSize: 24, color: "#6ec3d4" }}>
            Vérifié par escrow — impossible à truquer
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
