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
import { validateMeetingAndPay } from "../meeting-validation";

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
  await supabase
    .from("assignments")
    .update({ status: "active" })
    .eq("id", assignmentId)
    .eq("status", "applied");
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
    .select("id, missions!inner(company_id)")
    .eq("id", meetingId)
    .single();
  const missionOwner = (meeting?.missions as unknown as { company_id: string } | null)
    ?.company_id;
  if (!meeting || missionOwner !== profile.id) {
    return;
  }

  await validateMeetingAndPay(meetingId, profile.id);
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

  revalidatePath("/entreprises/dashboard");
  return { error: null, success: "RDV contesté. Notre équipe arbitrera sous 48h." };
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

  const supabase = await supabaseServer();
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, mission_id, status")
    .eq("id", assignmentId)
    .eq("caller_id", profile.id)
    .single();
  if (!assignment || assignment.status !== "active") {
    return { error: "Mission non active pour toi (candidature pas encore acceptée ?)." };
  }

  // Hash anti-farming : jamais l'email en clair (RGPD), dédup par mission en DB
  const contactHash = createHash("sha256").update(prospectEmail).digest("hex");

  const { error } = await supabase.from("meetings").insert({
    assignment_id: assignment.id,
    mission_id: assignment.mission_id,
    caller_id: profile.id,
    prospect_company: prospectCompany,
    prospect_contact_hash: contactHash,
    scheduled_at: scheduled.toISOString(),
    status: "booked",
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "Ce prospect a déjà un RDV comptabilisé sur cette mission." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return {
    error: null,
    success:
      "RDV déclaré. Il sera validé par l'entreprise (ou automatiquement 72h après le RDV s'il n'est pas contesté).",
  };
}
