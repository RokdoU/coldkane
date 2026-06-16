"use client";

import { useActionState } from "react";
import { updatePitchVideo } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/profile";

// Le caller colle l'URL d'une vidéo de pitch hébergée ailleurs (TikTok /
// Instagram / YouTube). Preuve sociale optionnelle affichée sur son profil
// public — la plateforme n'héberge rien. Champ vidé = retrait.
export function PitchVideoForm({
  currentUrl,
}: {
  currentUrl: string | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updatePitchVideo,
    { error: null },
  );

  return (
    <form action={action} className="mt-5 flex flex-col gap-3">
      {currentUrl && (
        <p className="text-xs leading-relaxed text-foreground/45">
          Vidéo actuelle :{" "}
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer break-all font-medium text-ice-400 hover:text-ice-300"
          >
            {currentUrl}
          </a>
        </p>
      )}

      <input
        type="url"
        name="pitchVideoUrl"
        defaultValue={currentUrl ?? ""}
        placeholder="https://www.tiktok.com/@toi/video/…"
        className="w-full rounded-md border border-night-500 bg-night-900 px-3 py-2 text-sm text-foreground placeholder:text-foreground/25 focus:border-night-400 focus:outline-none"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity duration-200 hover:opacity-85 disabled:cursor-default disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : currentUrl ? "Mettre à jour" : "Enregistrer"}
        </button>
        {currentUrl && (
          <span className="text-xs text-foreground/35">
            Vide le champ puis enregistre pour la retirer.
          </span>
        )}
        {state.success && <p className="text-xs text-ice-400">{state.success}</p>}
        {state.error && <p className="text-xs text-red-400">{state.error}</p>}
      </div>
    </form>
  );
}
