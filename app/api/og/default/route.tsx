// Image OG par défaut : utilisée par la home et toutes les pages sans carte
// OG dédiée. Même facture visuelle que les routes OG existantes (fond sombre,
// accent ice). Statique — aucune donnée lue, pas de paramètre.

import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/config";

export const runtime = "edge";

const ICE = "#6ec3d4";

export function GET() {
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
          padding: 80,
          position: "relative",
        }}
      >
        {/* Halo d'accent en filigrane */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 999,
            background: "rgba(110, 195, 212, 0.10)",
          }}
        />

        {/* Header : logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "rgba(110, 195, 212, 0.12)",
              color: ICE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            C
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
            {BRAND.name}
          </div>
        </div>

        {/* Accroche : nom + tagline + description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              maxWidth: 920,
            }}
          >
            {BRAND.tagline}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              color: "rgba(237,237,239,0.55)",
              maxWidth: 920,
            }}
          >
            {BRAND.description}
          </div>
        </div>

        {/* Pied : signal de confiance */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              width: 12,
              height: 12,
              borderRadius: 999,
              background: ICE,
            }}
          />
          <div style={{ display: "flex", fontSize: 26, color: ICE }}>
            Classement public vérifié par escrow — impossible à truquer
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
