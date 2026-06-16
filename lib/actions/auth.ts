"use server";

// Actions d'authentification. La création du profil (profiles + callers/companies)
// est gérée par le trigger Postgres handle_new_user (migration 003) à partir
// des metadata passées au signUp.

import { redirect } from "next/navigation";
import { supabaseServer } from "../supabase-server";
import { isSupabaseConfigured } from "../supabase";
import {
  clientIp,
  clientUserAgent,
  checkLoginRateLimit,
  recordLoginAttempt,
  recordSignupFingerprint,
  countRecentSignupsFromIp,
} from "../fraud";

export interface AuthState {
  error: string | null;
}

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Mode démo : l'inscription sera activée à la mise en production (Supabase non configuré).",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "caller");
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const referredByRaw = String(formData.get("referredBy") ?? "").trim().toLowerCase();
  const referredBy = USERNAME_RE.test(referredByRaw) ? referredByRaw : null;

  if (!email || !password || !fullName) {
    return { error: "Tous les champs sont obligatoires." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit faire au moins 8 caractères." };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      error:
        "Le pseudo doit faire 3 à 20 caractères : lettres minuscules, chiffres et _ uniquement.",
    };
  }
  if (role !== "caller" && role !== "company") {
    return { error: "Rôle invalide." };
  }
  if (role === "company" && !companyName) {
    return { error: "Le nom de l'entreprise est obligatoire." };
  }

  const supabase = await supabaseServer();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) {
    return { error: "Ce pseudo est déjà pris." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: fullName,
        role,
        company_name: companyName || null,
        referred_by_username: referredBy,
      },
    },
  });
  if (error) {
    return { error: error.message };
  }

  // Anti-fraude : capture de l'empreinte d'inscription + détection multi-comptes.
  // Le profil est créé par le trigger handle_new_user à partir des metadata ;
  // on attache l'IP/UA au profil puis on compte les inscriptions depuis cette IP.
  // NON BLOQUANT : un dépassement insère un fraud_flag sans refuser l'inscription.
  if (data.user) {
    const ip = await clientIp();
    const ua = await clientUserAgent();
    await recordSignupFingerprint(data.user.id, ip, ua);
    await countRecentSignupsFromIp(ip, data.user.id);
  }

  // Selon la config Supabase, la session peut nécessiter une confirmation email
  if (!data.session) {
    redirect("/connexion?confirm=1");
  }
  redirect(role === "company" ? "/entreprises/dashboard" : "/dashboard");
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Mode démo : la connexion sera activée à la mise en production (Supabase non configuré).",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  // Anti brute-force : refus propre au-delà du plafond horaire (email OU IP).
  const ip = await clientIp();
  if (!(await checkLoginRateLimit(email, ip))) {
    return { error: "Trop de tentatives, réessaie dans une heure." };
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Trace la tentative (succès/échec) pour le rate limiting.
  await recordLoginAttempt(email, ip, !error);

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  if (next.startsWith("/")) redirect(next);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  redirect(profile?.role === "company" ? "/entreprises/dashboard" : "/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
  }
  redirect("/");
}
