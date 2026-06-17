"use server";

// Pool de leads (sourcing hybride). L'entreprise ajoute des comptes cibles ;
// les callers actifs les réservent (lock atomique via RPC claim_lead).
// Niveau compte uniquement — jamais de contact perso en clair (RGPD).

import { revalidatePath } from "next/cache";
import { getSessionProfile, supabaseServer } from "../supabase-server";
import { isSupabaseConfigured, supabaseAdmin } from "../supabase";
import type { ActionState } from "./missions";

const DEMO: ActionState = {
  error: "Mode démo : cette action sera activée à la mise en production.",
};

// Entreprise : ajoute des comptes cibles à une mission (un par ligne).
// Format souple par ligne : "Nom du compte | indice | notes" (| optionnels).
export async function addLeads(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return DEMO;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "company") return { error: "Non autorisé." };

  const missionId = String(formData.get("missionId") ?? "");
  const raw = String(formData.get("leads") ?? "").trim();
  if (!missionId || !raw) return { error: "Ajoute au moins un compte." };

  // Ownership vérifié avant toute écriture service-role
  const db = supabaseAdmin();
  const { data: mission } = await db
    .from("missions")
    .select("id, company_id")
    .eq("id", missionId)
    .single();
  if (!mission || mission.company_id !== profile.id) {
    return { error: "Mission introuvable." };
  }

  const rows = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 500)
    .map((line) => {
      const [accountName, contactHint, notes] = line.split("|").map((p) => p.trim());
      return {
        mission_id: missionId,
        account_name: accountName,
        contact_hint: contactHint || null,
        notes: notes || null,
      };
    })
    .filter((r) => r.account_name);
  if (rows.length === 0) return { error: "Aucun compte valide." };

  const { error } = await db.from("leads").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/entreprises/dashboard");
  return { error: null, success: `${rows.length} lead(s) ajouté(s) au pool.` };
}

// Caller : réserve un lead disponible (lock atomique).
export async function claimLead(leadId: string): Promise<ActionState> {
  if (!isSupabaseConfigured()) return DEMO;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "caller") return { error: "Non autorisé." };

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("claim_lead", { p_lead_id: leadId });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { error: null, success: "Lead réservé — il est à toi." };
}

// Caller : relâche un lead réservé (remis au pool).
export async function releaseLead(leadId: string): Promise<ActionState> {
  if (!isSupabaseConfigured()) return DEMO;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "caller") return { error: "Non autorisé." };

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("release_lead", { p_lead_id: leadId });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { error: null, success: "Lead relâché." };
}
