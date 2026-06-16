"use server";

// Actions métier des deux faces. Toutes vérifient la session et l'ownership.
// Les écritures sensibles (validation, litige) passent par les fonctions
// Postgres security definer — jamais par un update direct.

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer, getSessionProfile } from "../supabase-server";
import { isSupabaseConfigured, supabaseAdmin } from "../supabase";
import { isStripeConfigured, createEscrowCheckout } from "../stripe";
import {
  sendMeetingDeclaredEmail,
  sendApplicationAcceptedEmail,
  sendDisputeOpenedEmails,
} from "../email";
import { validateMeetingAndPay } from "../meeting-validation";
import { tierForPoints, TIER_ORDER, TIER_LABELS } from "../ranking";
import { DISPUTE, EARN_AS_YOU_GO } from "../config";
import {
  checkDeclarationRateLimit,
  flagCollusionIfSuspicious,
} from "../fraud";
import type { Tier } from "../types";

export interface ActionState {
  error: string | null;
  success?: string | null;
}

const DEMO: ActionState = {
  error: "Mode démo : cette action sera activée à la mise en production.",
};

// =====================================================
// Côté entreprise
// =====================================================

export async function createMission(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return DEMO;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "company") {
    redirect("/connexion?next=/entreprises/poster");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sector = String(formData.get("sector") ?? "").trim();
  const targetPersona = String(formData.get("targetPersona") ?? "").trim() || null;
  const meetingType = String(formData.get("meetingType") ?? "").trim() || null;
  const pitchNotes = String(formData.get("pitchNotes") ?? "").trim() || null;
  const pricePerMeeting = Number(formData.get("pricePerMeeting"));
  const meetingsTarget = Number(formData.get("meetingsTarget"));
  const isBounty = formData.get("isBounty") === "on";

  if (!title || !description || !sector) {
    return { error: "Tous les champs sont obligatoires." };
  }
  if (!Number.isFinite(pricePerMeeting) || pricePerMeeting < 30) {
    return { error: "Prix par RDV : 30 € minimum." };
  }
  if (!Number.isInteger(meetingsTarget) || meetingsTarget < 1 || meetingsTarget > 500) {
    return { error: "Objectif : entre 1 et 500 RDV." };
  }

  const priceCents = Math.round(pricePerMeeting * 100);
  const budgetCents = priceCents * meetingsTarget;

  const supabase = await supabaseServer();
  const { data: mission, error } = await supabase
    .from("missions")
    .insert({
      company_id: profile.id,
      title,
      description,
      sector,
      target_persona: targetPersona,
      meeting_type: meetingType,
      pitch_notes: pitchNotes,
      status: "draft",
      price_per_meeting_cents: priceCents,
      meetings_target: meetingsTarget,
      budget_cents: budgetCents,
      is_bounty: isBounty,
      bounty_deadline: isBounty
        ? new Date(Date.now() + 7 * 86_400_000).toISOString()
        : null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Vers le paiement escrow
  if (isStripeConfigured()) {
    const session = await createEscrowCheckout({
      missionId: mission.id,
      title,
      budgetCents,
      origin: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    });
    if (session.url) redirect(session.url);
  }

  // Stripe pas encore branché : mission créée en draft, message explicite
  revalidatePath("/entreprises/dashboard");
  return {
    error: null,
    success:
      "Mission créée (brouillon). Le paiement escrow sera demandé dès que Stripe sera configuré.",
  };
}

export async function acceptApplication(assignmentId: string) {
  if (!isSupabaseConfigured()) return;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "company") return;

  const supabase = await supabaseServer();
  // RLS "company manages applications" garantit l'ownership
  const { data: updated } = await supabase
    .from("assignments")
    .update({ status: "active" })
    .eq("id", assignmentId)
    .eq("status", "applied")
    .select("id")
    .maybeSingle();

  // Notification caller — jamais bloquant
  if (updated) await sendApplicationAcceptedEmail(assignmentId);
  revalidatePath("/entreprises/dashboard");
}

export async function rejectApplication(assignmentId: string) {
  if (!isSupabaseConfigured()) return;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "company") return;

  const supabase = await supabaseServer();
  await supabase
    .from("assignments")
    .update({ status: "rejected" })
    .eq("id", assignmentId)
    .eq("status", "applied");
  revalidatePath("/entreprises/dashboard");
}

export async function companyValidateMeeting(meetingId: string) {
  if (!isSupabaseConfigured()) return;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "company") return;

  // Ownership vérifié explicitement avant l'appel service-role
  const db = supabaseAdmin();
  const { data: meeting } = await db
    .from("meetings")
    .select("id, caller_id, created_at, missions!inner(company_id)")
    .eq("id", meetingId)
    .single();
  const missionOwner = (meeting?.missions as unknown as { company_id: string } | null)
    ?.company_id;
  if (!meeting || missionOwner !== profile.id) {
    return;
  }

  const result = await validateMeetingAndPay(meetingId, profile.id);

  // Anti-collusion : signaux après une validation réussie (validation éclair,
  // même IP d'inscription caller/entreprise). NON BLOQUANT : flag + alerte.
  if (result.ok) {
    await flagCollusionIfSuspicious({
      meetingId: meeting.id,
      callerId: meeting.caller_id,
      companyId: profile.id,
      declaredAt: meeting.created_at,
      validatedAt: new Date().toISOString(),
    });
  }

  revalidatePath("/entreprises/dashboard");
}

export async function companyDisputeMeeting(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return DEMO;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "company") return { error: "Non autorisé." };

  const meetingId = String(formData.get("meetingId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "Indique la raison de la contestation." };

  const db = supabaseAdmin();
  const { error } = await db.rpc("dispute_meeting", {
    p_meeting_id: meetingId,
    p_company_id: profile.id,
    p_reason: reason,
  });
  if (error) return { error: error.message };

  // Notifie les deux parties — jamais bloquant
  await sendDisputeOpenedEmails(meetingId, reason);

  revalidatePath("/entreprises/dashboard");
  return {
    error: null,
    success: `RDV contesté. Le caller a ${DISPUTE.slaHours}h pour répondre, sans quoi le litige est tranché automatiquement.`,
  };
}

// =====================================================
// Côté caller
// =====================================================

export async function applyToMission(missionId: string): Promise<ActionState> {
  if (!isSupabaseConfigured()) return DEMO;
  const profile = await getSessionProfile();
  if (!profile) redirect(`/connexion?next=/missions`);
  if (profile.role !== "caller") return { error: "Réservé aux callers." };

  const supabase = await supabaseServer();

  // La mission doit accepter des candidatures (RLS : draft/cancelled invisibles)
  const { data: mission } = await supabase
    .from("missions")
    .select("status, min_tier")
    .eq("id", missionId)
    .single();
  if (!mission || !["funded", "active"].includes(mission.status)) {
    return { error: "Cette mission n'accepte plus de candidatures." };
  }

  // Tier minimum requis (filtre qualité posé par l'entreprise)
  if (mission.min_tier) {
    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();
    let points = 0;
    let rank: number | undefined;
    if (season) {
      const { data: score } = await supabase
        .from("season_scores")
        .select("points")
        .eq("season_id", season.id)
        .eq("caller_id", profile.id)
        .single();
      points = score?.points ?? 0;
      if (score) {
        const { count } = await supabase
          .from("season_scores")
          .select("*", { count: "exact", head: true })
          .eq("season_id", season.id)
          .gt("points", points);
        rank = (count ?? 0) + 1;
      }
    }
    const tier = tierForPoints(points, rank);
    const required = mission.min_tier as Tier;
    if (TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(required)) {
      return {
        error: `Mission réservée au tier ${TIER_LABELS[required]} et au-dessus.`,
      };
    }
  }

  const { error } = await supabase.from("assignments").insert({
    mission_id: missionId,
    caller_id: profile.id,
  });
  if (error) {
    if (error.code === "23505") return { error: null, success: "Candidature déjà envoyée." };
    return { error: error.message };
  }
  revalidatePath("/missions");
  revalidatePath(`/missions/${missionId}`);
  revalidatePath("/dashboard");
  return { error: null, success: "Candidature envoyée !" };
}

export async function declareMeeting(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return DEMO;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "caller") return { error: "Non autorisé." };

  // Anti-farming : plafond de déclarations sur 24h glissantes. Refus propre.
  if (!(await checkDeclarationRateLimit(profile.id))) {
    return { error: "Plafond de déclarations atteint pour aujourd'hui." };
  }

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const prospectCompany = String(formData.get("prospectCompany") ?? "").trim();
  const prospectEmail = String(formData.get("prospectEmail") ?? "")
    .trim()
    .toLowerCase();
  const scheduledAt = String(formData.get("scheduledAt") ?? "");

  if (!assignmentId || !prospectCompany || !prospectEmail || !scheduledAt) {
    return { error: "Tous les champs sont obligatoires." };
  }
  const scheduled = new Date(scheduledAt);
  if (Number.isNaN(scheduled.getTime()) || scheduled.getTime() < Date.now() - 86_400_000) {
    return { error: "La date du RDV est invalide." };
  }

  // Hash anti-farming : jamais l'email en clair (RGPD), dédup par mission en DB
  const contactHash = createHash("sha256").update(prospectEmail).digest("hex");

  const supabase = await supabaseServer();
  const { data: meeting, error } = await supabase.rpc("declare_meeting", {
    p_assignment_id: assignmentId,
    p_prospect_company: prospectCompany,
    p_contact_hash: contactHash,
    p_scheduled_at: scheduled.toISOString(),
    // Plafond earn-as-you-go (config = source de vérité, appliqué en DB)
    p_base_open: EARN_AS_YOU_GO.baseOpenMeetings,
    p_unlock_per: EARN_AS_YOU_GO.unlockPerValidated,
    p_max_open: EARN_AS_YOU_GO.maxOpenMeetings,
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "Ce prospect a déjà un RDV comptabilisé sur cette mission." };
    }
    return { error: error.message };
  }

  // Notification entreprise (valider/contester sous 72h) — jamais bloquant
  if (meeting) {
    await sendMeetingDeclaredEmail(
      meeting as {
        mission_id: string;
        caller_id: string;
        prospect_company: string;
        scheduled_at: string;
      },
    );
  }

  revalidatePath("/dashboard");
  return {
    error: null,
    success:
      "RDV déclaré. Il sera validé par l'entreprise (ou automatiquement 72h après le RDV s'il n'est pas contesté).",
  };
}

export async function submitDisputeEvidence(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return DEMO;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "caller") return { error: "Non autorisé." };

  const meetingId = String(formData.get("meetingId") ?? "");
  const evidence = String(formData.get("evidence") ?? "").trim();
  if (!evidence) return { error: "Décris ta preuve (lien d'agenda, échange, enregistrement…)." };

  // RPC security definer : vérifie l'ownership et le statut 'disputed' en DB
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("submit_dispute_evidence", {
    p_meeting_id: meetingId,
    p_evidence: evidence,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return {
    error: null,
    success:
      "Preuve enregistrée. Sans escalade de l'entreprise, le RDV sera validé à l'échéance du litige.",
  };
}
