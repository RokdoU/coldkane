// Carte ambassadeur en image OG : quand un caller partage son lien
// d'affiliation, sa carte « X filleuls / X € générés » s'affiche. Adossée à la
// vue publique ambassador_stats (colonnes sûres uniquement, jamais d'email).
// En démo ou si l'ambassadeur est inconnu : carte neutre (comme /api/og/[username]).

import { ImageResponse } from "next/og";
import { isSupabaseConfigured, supabasePublic } from "@/lib/supabase";
import { formatEuros } from "@/lib/ranking";

export const runtime = "edge";

const ICE = "#6ec3d4";

interface AmbassadorCard {
  username: string;
  referralsCount: number;
  generatedCents: number;
}

// Lecture de la vue publique : agrégats sûrs par parrain.
async function lookupAmbassador(username: string): Promise<AmbassadorCard | null> {
  const { data } = await supabasePublic()
    .from("ambassador_stats")
    .select("referrer_username, referrals_count, generated_cents")
    .eq("referrer_username", username)
    .maybeSingle();
  if (!data) return null;
  return {
    username: data.referrer_username as string,
    referralsCount: (data.referrals_count as number) ?? 0,
    generatedCents: (data.generated_cents as number) ?? 0,
  };
}

// Carte neutre : démo ou ambassadeur sans filleuls (rien de réel à prouver).
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
  ctx: { params: Promise<{ username: string }> },
) {
  const { username } = await ctx.params;

  // Mode démo : pas de base à interroger, carte neutre (le site entier est fictif).
  if (!isSupabaseConfigured()) return neutralCard();

  const card = await lookupAmbassador(username);
  // Inconnu ou aucun filleul → carte neutre (pas de chiffre fort à afficher).
  if (!card || card.referralsCount === 0) return neutralCard();

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
        {/* Halo discret ice */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: 300,
            width: 600,
            height: 500,
            borderRadius: 999,
            background: ICE,
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
              color: ICE,
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

        {/* Le chiffre fort */}
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
              color: ICE,
            }}
          >
            Ambassadeur ColdKane
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
            {card.referralsCount} {card.referralsCount > 1 ? "filleuls" : "filleul"}
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "rgba(237,237,239,0.55)" }}>
            @{card.username} · {formatEuros(card.generatedCents)} générés
          </div>
        </div>

        {/* Footer : la preuve, toujours */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              width: 10,
              height: 10,
              borderRadius: 999,
              background: ICE,
            }}
          />
          <div style={{ display: "flex", fontSize: 24, color: ICE }}>
            Vérifié par escrow — impossible à truquer
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
