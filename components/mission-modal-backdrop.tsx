"use client";

import { useRouter } from "next/navigation";

export function MissionModalBackdrop() {
  const router = useRouter();
  return (
    <div
      className="absolute inset-0 cursor-pointer bg-black/70 backdrop-blur-sm"
      style={{ animation: "backdrop-in 0.15s ease-out forwards" }}
      onClick={() => router.push("/missions")}
      aria-label="Fermer"
    />
  );
}
