"use server";

// Action profil caller : enregistrer (ou retirer) l'URL de sa vidéo de pitch.
// La plateforme n'héberge rien — on ne stocke qu'un lien externe (TikTok /
// Instagram / YouTube). Preuve sociale optionnelle, pas un gate ni une note.
// Pattern ActionState aligné sur lib/actions/missions.ts.

import { revalidatePath } from "next/cache";
import { supabaseServer, getSessionProfile } from "../supabase-server";
import { isSupabaseConfigured } from "../supabase";

export interface ActionState {
  error: string | null;
  success?: string | null;
}

const DEMO: ActionState = {
  error: "Mode démo : cette action sera activée à la mise en production.",
};

// Domaines vidéo plausibles : on reste tolérant (sous-domaines acceptés) mais
// on rejette tout ce qui n'est pas une URL http(s) d'une plateforme connue.
const VIDEO_HOSTS = ["youtube.com", "youtu.be", "tiktok.com", "instagram.com"];

function isPlausibleVideoUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  return VIDEO_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export async function updatePitchVideo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return DEMO;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "caller") return { error: "Non autorisé." };

  const raw = String(formData.get("pitchVideoUrl") ?? "").trim();

  // Champ vide = le caller retire sa vidéo.
  if (raw === "") {
    const supabase = await supabaseServer();
    const { error } = await supabase
      .from("callers")
      .update({ pitch_video_url: null })
      .eq("profile_id", profile.id);
    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    revalidatePath(`/c/${profile.username}`);
    return { error: null, success: "Vidéo de pitch retirée." };
  }

  if (!isPlausibleVideoUrl(raw)) {
    return {
      error:
        "Lien invalide. Colle l'URL complète d'une vidéo TikTok, Instagram ou YouTube.",
    };
  }

  // RLS "own caller row" + grant colonne pitch_video_url autorisent l'update.
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("callers")
    .update({ pitch_video_url: raw })
    .eq("profile_id", profile.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/c/${profile.username}`);
  return { error: null, success: "Vidéo de pitch enregistrée." };
}
