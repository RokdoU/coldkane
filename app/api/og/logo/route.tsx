// Logo carré 512×512 pour schema.org Organization.logo (rich results + GEO).
// Même facture que les autres visuels : marque « C » glaciale sur fond sombre.

import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#0a0a0b",
        }}
      >
        <div
          style={{
            width: 168,
            height: 168,
            borderRadius: 40,
            background: "rgba(110, 195, 212, 0.12)",
            color: "#6ec3d4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 104,
            fontWeight: 700,
          }}
        >
          C
        </div>
        <div style={{ color: "#ededef", fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>
          ColdKane
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
