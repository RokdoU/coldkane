// POST /api/meetings/validate — validation par le back-office / outils internes.
// Protégé par secret. Les entreprises valident via leur dashboard (server action).

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { validateMeetingAndPay } from "@/lib/meeting-validation";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase non configuré (mode démo)" },
      { status: 503 },
    );
  }

  const { meetingId, validatedBy } = await req.json();
  if (!meetingId) {
    return NextResponse.json({ error: "meetingId requis" }, { status: 400 });
  }

  const result = await validateMeetingAndPay(meetingId, validatedBy ?? null);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({ ok: true });
}
