// Favicon généré (manquait) : la marque « C » glaciale sur fond sombre.
// Apparaît dans l'onglet, les favoris et les résultats de recherche.

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          color: "#6ec3d4",
          fontSize: 22,
          fontWeight: 700,
          borderRadius: 6,
        }}
      >
        C
      </div>
    ),
    { ...size },
  );
}
