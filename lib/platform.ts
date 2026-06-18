// Kill switch lu au runtime (table platform_flags, migration 021). Mis en cache
// 30 s : un toggle depuis Supabase prend effet en < 30 s, sans redéploiement.
// En mode démo (Supabase non configuré) : rien n'est en pause.

import { unstable_cache } from "next/cache";
import { isSupabaseConfigured, supabasePublic } from "./supabase";

export interface PlatformFlags {
  signupsPaused: boolean;
  newMissionsPaused: boolean;
  notice: string | null;
}

const DEFAULT_FLAGS: PlatformFlags = {
  signupsPaused: false,
  newMissionsPaused: false,
  notice: null,
};

const fetchFlags = unstable_cache(
  async (): Promise<PlatformFlags> => {
    const { data } = await supabasePublic()
      .from("platform_flags")
      .select("signups_paused, new_missions_paused, notice")
      .single();
    if (!data) return DEFAULT_FLAGS;
    return {
      signupsPaused: Boolean(data.signups_paused),
      newMissionsPaused: Boolean(data.new_missions_paused),
      notice: (data.notice as string) ?? null,
    };
  },
  ["platform-flags"],
  { revalidate: 30 },
);

export async function getPlatformFlags(): Promise<PlatformFlags> {
  if (!isSupabaseConfigured()) return DEFAULT_FLAGS;
  try {
    return await fetchFlags();
  } catch {
    return DEFAULT_FLAGS; // jamais bloquant si la lecture échoue
  }
}
