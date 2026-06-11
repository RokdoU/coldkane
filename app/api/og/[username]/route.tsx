// Carte joueur en image OG : quand un caller partage son profil sur X ou
// LinkedIn, son rang/tier/stats s'affichent — le profil EST le contenu.

import { ImageResponse } from "next/og";
import { getCallerByUsername } from "@/lib/data";
import { TIER_LABELS } from "@/lib/ranking";

export const runtime = "edge";

const TIER_COLORS: Record<string, string> = {
  bronze: "#a98963",
  argent: "#9ba6b2",
  or: "#cfa84e",
  platine: "#7fc4bd",
  diamant: "#a99fd6",
  legende: "#d3697f",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> },
) {
  const { username } = await ctx.params;
  const entry = await getCallerByUsername(username);

  if (!entry) {
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

  const tierColor = TIER_COLORS[entry.tier] ?? "#6ec3d4";

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
        {/* Rang en filigrane */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: 24,
            fontSize: 380,
            fontWeight: 700,
            color: "#161618",
          }}
        >
          {String(entry.rank).padStart(2, "0")}
        </div>

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

        {/* Identité */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>
              {entry.caller.username}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 24px",
                borderRadius: 999,
                border: `2px solid ${tierColor}`,
                color: tierColor,
                fontSize: 28,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 4,
              }}
            >
              {TIER_LABELS[entry.tier]}
            </div>
          </div>
          {entry.caller.headline && (
            <div style={{ display: "flex", fontSize: 30, color: "rgba(237,237,239,0.5)" }}>
              {entry.caller.headline}
            </div>
          )}
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
              Stats vérifiées par escrow — impossibles à truquer
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { value: `#${entry.rank}`, label: "RANG" },
            { value: entry.points.toLocaleString("fr-FR"), label: "POINTS" },
            { value: String(entry.meetingsValidated), label: "RDV VALIDÉS" },
            { value: String(entry.bestStreak), label: "MEILLEUR STREAK" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: "24px 36px",
                borderRadius: 16,
                border: "1px solid #222226",
                background: "#111113",
              }}
            >
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>{s.value}</div>
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  letterSpacing: 3,
                  color: "rgba(237,237,239,0.4)",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
