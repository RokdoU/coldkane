// Anti-abus / anti-fraude — détection automatique côté serveur.
//
// Philosophie : on FLAGUE et on ALERTE, on ne bloque jamais silencieusement.
// Seuls les abus de débit (rate limiting login + plafond de déclarations)
// refusent proprement via une valeur de retour — jamais via une exception.
// Tout le reste (multi-comptes, collusion) est tracé dans fraud_flags pour
// revue. Ces helpers sont non bloquants pour le flux métier : try/catch
// interne, ne throw jamais (sauf logique de rate limit, qui renvoie un bool).
//
// Écritures sensibles via supabaseAdmin (service role) : les tables
// auth_attempts / fraud_flags et les colonnes signup_* sont inaccessibles aux
// clients (cf. migration 013, RLS sans policy).

import { headers } from "next/headers";
import { supabaseAdmin } from "./supabase";
import { notifyOps } from "./email";
import { FRAUD } from "./config";

// =====================================================
// Lecture de l'origine de la requête (IP / User-Agent)
// =====================================================

// IP source. Derrière Vercel, x-forwarded-for est posé par l'edge : on prend
// la PREMIÈRE IP de la liste (le client réel ; les suivantes sont les proxies).
// Fallbacks usuels si la chaîne change. Renvoie null si rien d'exploitable.
// NB : une IP reste falsifiable hors infra de confiance — c'est un SIGNAL, pas
// une preuve. On ne l'utilise que pour flag + throttle, jamais pour bloquer un
// compte définitivement.
export async function clientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    if (fwd) {
      const first = fwd.split(",")[0]?.trim();
      if (first) return first;
    }
    return h.get("x-real-ip") ?? null;
  } catch {
    return null;
  }
}

export async function clientUserAgent(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("user-agent") ?? null;
  } catch {
    return null;
  }
}

// =====================================================
// Rate limiting login (anti brute-force / credential stuffing)
// =====================================================

// Enregistre la tentative et renvoie true si le login est AUTORISÉ (sous le
// plafond). On compte les échecs de la dernière heure pour cet identifiant OU
// cette IP : un attaquant fait varier l'un des deux, on plafonne sur les deux.
// Une tentative réussie ne consomme pas le quota (on n'enregistre l'échec
// qu'après coup, via success=false).
export async function checkLoginRateLimit(
  identifier: string,
  ip: string | null,
): Promise<boolean> {
  try {
    const db = supabaseAdmin();
    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Échecs récents pour cet identifiant OU cette IP. Les valeurs sont
    // encadrées de guillemets doubles : PostgREST traite alors virgule/
    // parenthèse comme du littéral, pas comme des séparateurs de filtre
    // (un email saisi reste une donnée non maîtrisée).
    let query = db
      .from("auth_attempts")
      .select("id", { count: "exact", head: true })
      .eq("success", false)
      .gte("created_at", sinceIso);
    query = ip
      ? query.or(`identifier.eq."${identifier}",ip.eq."${ip}"`)
      : query.eq("identifier", identifier);
    const { count } = await query;

    return (count ?? 0) < FRAUD.maxLoginAttemptsPerHour;
  } catch (err) {
    // Anti-fraude jamais bloquant : en cas d'incident DB, on laisse passer
    // (la disponibilité du login prime sur le throttle).
    console.error("[fraud] checkLoginRateLimit:", err);
    return true;
  }
}

// Trace une tentative de connexion (succès ou échec) pour le rate limiting.
// À appeler après signInWithPassword, avec le résultat réel.
export async function recordLoginAttempt(
  identifier: string,
  ip: string | null,
  success: boolean,
): Promise<void> {
  try {
    await supabaseAdmin()
      .from("auth_attempts")
      .insert({ identifier, ip, success });
  } catch (err) {
    console.error("[fraud] recordLoginAttempt:", err);
  }
}

// =====================================================
// Plafond de déclarations de RDV par caller (anti-farming de débit)
// =====================================================

// True si le caller est SOUS le plafond quotidien (24h glissantes). On compte
// directement dans meetings par caller_id + created_at : pas de table dédiée.
// Les RDV annulés comptent quand même (un farmer pourrait spammer puis annuler).
export async function checkDeclarationRateLimit(
  callerId: string,
): Promise<boolean> {
  try {
    const db = supabaseAdmin();
    const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await db
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("caller_id", callerId)
      .gte("created_at", sinceIso);
    return (count ?? 0) < FRAUD.maxDeclarationsPerDay;
  } catch (err) {
    // Jamais bloquant : en cas d'incident DB, on laisse déclarer.
    console.error("[fraud] checkDeclarationRateLimit:", err);
    return true;
  }
}

// =====================================================
// Détection multi-comptes (empreinte d'inscription)
// =====================================================

// Capture l'empreinte d'inscription (IP + User-Agent) sur le profil. Sert au
// comptage multi-comptes et à la détection de collusion (même IP caller/entreprise).
export async function recordSignupFingerprint(
  profileId: string,
  ip: string | null,
  ua: string | null,
): Promise<void> {
  try {
    await supabaseAdmin()
      .from("profiles")
      .update({ signup_ip: ip, signup_user_agent: ua })
      .eq("id", profileId);
  } catch (err) {
    console.error("[fraud] recordSignupFingerprint:", err);
  }
}

// Compte les inscriptions depuis cette IP sur 24h. Si le plafond est dépassé,
// insère un fraud_flag 'multi_account' — mais NE bloque PAS l'inscription
// (saison 0 : on observe avant de durcir). Renvoie le nombre de comptes vus.
export async function countRecentSignupsFromIp(
  ip: string | null,
  newProfileId?: string,
): Promise<number> {
  if (!ip) return 0;
  try {
    const db = supabaseAdmin();
    const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, count } = await db
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("signup_ip", ip)
      .gte("created_at", sinceIso);

    const total = count ?? 0;
    if (total > FRAUD.maxSignupsPerIpPerDay) {
      const flag = {
        kind: "multi_account",
        subject_profile_id: newProfileId ?? null,
        details: {
          ip,
          signups_last_24h: total,
          threshold: FRAUD.maxSignupsPerIpPerDay,
          profile_ids: (data ?? []).map((p) => p.id),
        },
      };
      await db.from("fraud_flags").insert(flag);
      await notifyFraudAlert(flag);
    }
    return total;
  } catch (err) {
    // Jamais bloquant : l'inscription n'attend pas l'anti-fraude.
    console.error("[fraud] countRecentSignupsFromIp:", err);
    return 0;
  }
}

// =====================================================
// Détection de collusion (caller ⇄ entreprise)
// =====================================================

// Signaux de collusion sur un RDV validé :
//   (a) validation entreprise très rapide après déclaration (< rapidValidationSeconds)
//       → l'entreprise « valide les yeux fermés » un compère.
//   (b) même signup_ip entre le caller et l'entreprise de la mission
//       → potentiellement la même personne des deux côtés.
// Si l'un est vrai → fraud_flag 'collusion' (+ alerte). NE bloque PAS : saison 0,
// on flague et on revoit. ÉVOLUTION : geler la transaction (escrow non libéré)
// le temps de la revue plutôt que de payer puis récupérer.
export async function flagCollusionIfSuspicious(params: {
  meetingId: string;
  callerId: string;
  companyId: string;
  declaredAt: string; // meeting.created_at
  validatedAt: string; // now()
}): Promise<void> {
  const { meetingId, callerId, companyId, declaredAt, validatedAt } = params;
  try {
    const db = supabaseAdmin();

    // (a) délai déclaration → validation
    const elapsedSeconds =
      (new Date(validatedAt).getTime() - new Date(declaredAt).getTime()) / 1000;
    const rapidValidation =
      Number.isFinite(elapsedSeconds) &&
      elapsedSeconds >= 0 &&
      elapsedSeconds < FRAUD.rapidValidationSeconds;

    // (b) même IP d'inscription caller / entreprise
    const { data: parties } = await db
      .from("profiles")
      .select("id, signup_ip")
      .in("id", [callerId, companyId]);
    const callerIp = parties?.find((p) => p.id === callerId)?.signup_ip ?? null;
    const companyIp =
      parties?.find((p) => p.id === companyId)?.signup_ip ?? null;
    const sameSignupIp = Boolean(callerIp && companyIp && callerIp === companyIp);

    if (!rapidValidation && !sameSignupIp) return;

    const flag = {
      kind: "collusion",
      subject_meeting_id: meetingId,
      subject_profile_id: callerId,
      details: {
        company_id: companyId,
        rapid_validation: rapidValidation,
        elapsed_seconds: Math.round(elapsedSeconds),
        threshold_seconds: FRAUD.rapidValidationSeconds,
        same_signup_ip: sameSignupIp,
        signup_ip: sameSignupIp ? callerIp : null,
      },
    };
    await db.from("fraud_flags").insert(flag);
    await notifyFraudAlert(flag);
  } catch (err) {
    // Jamais bloquant : le RDV est déjà validé/payé, le flag est best-effort.
    console.error("[fraud] flagCollusionIfSuspicious:", err);
  }
}

// =====================================================
// Alerte (branchement email plus tard)
// =====================================================

// Émet une alerte : log structuré (toujours) + email ops (si configuré).
// Best-effort, jamais bloquant pour le flux métier.
export async function notifyFraudAlert(flag: {
  kind: string;
  subject_meeting_id?: string | null;
  subject_profile_id?: string | null;
  details?: unknown;
}): Promise<void> {
  console.error(
    "[fraud][ALERT]",
    JSON.stringify({
      kind: flag.kind,
      subject_meeting_id: flag.subject_meeting_id ?? null,
      subject_profile_id: flag.subject_profile_id ?? null,
      details: flag.details ?? {},
      at: new Date().toISOString(),
    }),
  );
  await notifyOps(`Flag fraude : ${flag.kind}`, [
    flag.subject_profile_id ? `Profil : ${flag.subject_profile_id}` : "",
    flag.subject_meeting_id ? `RDV : ${flag.subject_meeting_id}` : "",
    `Détails : ${JSON.stringify(flag.details ?? {})}`,
    `À revoir dans la table fraud_flags.`,
  ].filter(Boolean));
}
