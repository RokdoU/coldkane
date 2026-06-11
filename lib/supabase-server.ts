// Clients Supabase côté serveur (App Router) — sessions portées par les cookies.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./supabase";

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // appelé depuis un Server Component : le proxy rafraîchit la session
          }
        },
      },
    },
  );
}

export interface SessionProfile {
  id: string;
  role: "caller" | "company";
  username: string;
  fullName: string;
}

// Utilisateur connecté + son profil. null si non connecté ou non configuré.
export async function getSessionProfile(): Promise<SessionProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, username, full_name")
    .eq("id", user.id)
    .single();
  if (!profile) return null;
  return {
    id: profile.id,
    role: profile.role,
    username: profile.username,
    fullName: profile.full_name,
  };
}
