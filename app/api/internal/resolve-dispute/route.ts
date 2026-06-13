// POST /api/internal/resolve-dispute — arbitrage des RDV contestés (saison 0 :
// l'équipe tranche). Protégé par INTERNAL_API_SECRET.
// outcome 'cancelled' : le RDV est annulé (RPC resolve_dispute).
// outcome 'validated' : le RDV repasse 'booked' (RPC undispute_meeting) puis
// validation + payout via validateMeetingAndPay — le circuit unique, jamais
// de transfer Stripe direct ici.

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { validateMeetingAndPay } from "@/lib/meeting-validation";

export async function POST(req: NextRequest) {
  // Refus systématique si le secret n'est pas configuré (jamais de Bearer vide)
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase non configuré (mode démo)" },
      { status: 503 },
    );
  }

  let body: { meetingId?: string; outcome?: string; adminId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body JSON invalide" }, { status: 400 });
  }

  const { meetingId, outcome, adminId } = body;
  if (!meetingId || (outcome !== "validated" && outcome !== "cancelled")) {
    return NextResponse.json(
      { error: "meetingId et outcome ('validated' | 'cancelled') requis" },
      { status: 400 },
    );
  }

  const db = supabaseAdmin();

  // Litige en faveur de l'entreprise : RDV annulé, le hash prospect
  // redevient déclarable (index meetings_dedup exclut 'cancelled').
  if (outcome === "cancelled") {
    const { error } = await db.rpc("resolve_dispute", {
      p_meeting_id: meetingId,
      p_outcome: "cancelled",
      p_admin: adminId ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 422 });
    return NextResponse.json({ resolved: "cancelled" });
  }

  // Litige en faveur du caller : disputed → booked, puis validation + payout.
  const { error } = await db.rpc("undispute_meeting", { p_meeting_id: meetingId });
  if (error) return NextResponse.json({ error: error.message }, { status: 422 });

  const result = await validateMeetingAndPay(meetingId, adminId ?? null);
  if (!result.ok) {
    // Le RDV est resté 'booked' : le cron auto-validate le rattrapera.
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({ resolved: "validated" });
}
