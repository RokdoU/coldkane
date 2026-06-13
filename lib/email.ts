// Emails transactionnels via Resend. Même philosophie que lib/stripe.ts :
// no-op silencieux tant que RESEND_API_KEY n'est pas configurée (mode démo).
// Un email ne fait JAMAIS échouer le flux appelant : chaque fonction attrape
// ses propres erreurs (console.error) et renvoie false au lieu de throw.

import { Resend } from "resend";
import { supabaseAdmin } from "./supabase";
import { formatEuros } from "./ranking";
import { POINTS } from "./config";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function resend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY manquante");
  return new Resend(key);
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Les emails vivent dans auth.users, pas dans profiles (RGPD : jamais exposés
// côté client). Lookup service role uniquement.
async function profileEmail(profileId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin().auth.admin.getUserById(profileId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

function formatDateFr(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}

// =====================================================
// Gabarit HTML sobre (inline styles, pas de framework)
// =====================================================

function layout(content: string): string {
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f4f4f5;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
      <p style="font-size:18px;font-weight:700;letter-spacing:-0.02em;margin:0 0 20px;">ColdKane</p>
      <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:28px;font-size:15px;line-height:1.6;">
        ${content}
      </div>
      <p style="font-size:12px;color:#71717a;text-align:center;margin:20px 0 0;">
        ColdKane — le ladder des cold callers.<br/>
        Vous recevez cet email car vous avez un compte sur ColdKane.
      </p>
    </div>
  </body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="font-size:20px;font-weight:700;margin:0 0 16px;">${text}</h1>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0 8px;"><a href="${href}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">${label}</a></p>`;
}

function detailRows(rows: [string, string][]): string {
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#71717a;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 0;font-weight:600;">${value}</td></tr>`,
    )
    .join("")}</table>`;
}

// Envoi bas niveau : true si l'email est parti, false sinon (jamais de throw)
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    const { error } = await resend().emails.send({
      from: process.env.EMAIL_FROM ?? "ColdKane <noreply@coldkane.fr>",
      to,
      subject,
      html,
    });
    if (error) {
      console.error(`email non envoyé (${subject}) :`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`email non envoyé (${subject}) :`, err);
    return false;
  }
}

// =====================================================
// (a) RDV déclaré → l'entreprise doit valider ou contester
// =====================================================

export async function sendMeetingDeclaredEmail(meeting: {
  mission_id: string;
  caller_id: string;
  prospect_company: string;
  scheduled_at: string;
}): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    const db = supabaseAdmin();
    const { data: mission } = await db
      .from("missions")
      .select("title, company_id, price_per_meeting_cents")
      .eq("id", meeting.mission_id)
      .single();
    if (!mission) return false;

    const [{ data: caller }, to] = await Promise.all([
      db.from("profiles").select("full_name").eq("id", meeting.caller_id).single(),
      profileEmail(mission.company_id),
    ]);
    if (!to) return false;

    const html = layout(
      heading("Un RDV vient d'être déclaré") +
        `<p style="margin:0;">Un RDV a été déclaré sur votre mission <strong>${mission.title}</strong>. Vérifiez-le, puis validez ou contestez depuis votre dashboard.</p>` +
        detailRows([
          ["Prospect", meeting.prospect_company],
          ["Date du RDV", formatDateFr(meeting.scheduled_at)],
          ["Caller", caller?.full_name ?? "—"],
          ["Montant débité de l'escrow à la validation", formatEuros(mission.price_per_meeting_cents)],
        ]) +
        button(`${siteUrl()}/entreprises/dashboard`, "Valider ou contester") +
        `<p style="font-size:13px;color:#71717a;margin:16px 0 0;">Sans action de votre part sous 72&nbsp;h après l'heure du RDV, il sera validé automatiquement et le montant sera débité de votre escrow.</p>`,
    );
    return sendEmail(to, `Nouveau RDV à valider — ${mission.title}`, html);
  } catch (err) {
    console.error("email RDV déclaré :", err);
    return false;
  }
}

// =====================================================
// (b) Rappel ~48h avant l'auto-validation → l'entreprise
// =====================================================

export async function sendAutoValidationReminderEmail(params: {
  companyId: string;
  missionTitle: string;
  prospectCompany: string;
  scheduledAt: string;
  amountCents: number;
}): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    const to = await profileEmail(params.companyId);
    if (!to) return false;

    const html = layout(
      heading("Validation automatique dans ~48 h") +
        `<p style="margin:0;">Le RDV ci-dessous, déclaré sur votre mission <strong>${params.missionTitle}</strong>, n'a pas encore été validé ni contesté.</p>` +
        detailRows([
          ["Prospect", params.prospectCompany],
          ["Date du RDV", formatDateFr(params.scheduledAt)],
          ["Montant débité de l'escrow", formatEuros(params.amountCents)],
        ]) +
        `<p style="margin:0;">Sans action de votre part, il sera validé automatiquement dans environ 48&nbsp;h et le montant sera débité de votre escrow.</p>` +
        button(`${siteUrl()}/entreprises/dashboard`, "Vérifier ce RDV"),
    );
    return sendEmail(to, `Validation automatique dans 48 h — ${params.missionTitle}`, html);
  } catch (err) {
    console.error("email rappel auto-validation :", err);
    return false;
  }
}

// =====================================================
// (c) RDV validé → le caller (payout) et l'entreprise (récap)
// =====================================================

export async function sendMeetingValidatedEmails(meeting: {
  mission_id: string;
  caller_id: string;
  prospect_company: string;
  payout_cents: number | null;
}): Promise<void> {
  if (!isEmailConfigured()) return;
  try {
    const db = supabaseAdmin();
    const { data: mission } = await db
      .from("missions")
      .select("title, company_id, price_per_meeting_cents")
      .eq("id", meeting.mission_id)
      .single();
    if (!mission) return;

    // Points gagnés : même formule que la RPC validate_meeting
    // (base + bonus streak), reconstituée depuis le score à jour
    let pointsLine = "";
    const { data: season } = await db
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();
    if (season) {
      const { data: score } = await db
        .from("season_scores")
        .select("points, current_streak")
        .eq("season_id", season.id)
        .eq("caller_id", meeting.caller_id)
        .single();
      if (score && score.current_streak >= 1) {
        const earned =
          POINTS.meetingValidated +
          Math.min((score.current_streak - 1) * POINTS.streakBonusPerMeeting, POINTS.streakBonusCap);
        pointsLine = `<p style="margin:0 0 16px;"><strong>+${earned} points</strong> au ladder${
          score.current_streak > 1 ? ` (streak de ${score.current_streak})` : ""
        } — total saison : ${score.points} points.</p>`;
      }
    }

    // Email caller : félicitations + montant net
    const callerTo = await profileEmail(meeting.caller_id);
    if (callerTo && meeting.payout_cents != null) {
      const html = layout(
        heading("RDV validé, bien joué !") +
          `<p style="margin:0;">Ton RDV avec <strong>${meeting.prospect_company}</strong> sur la mission <strong>${mission.title}</strong> vient d'être validé.</p>` +
          detailRows([["Montant net versé", formatEuros(meeting.payout_cents)]]) +
          pointsLine +
          `<p style="margin:0;">Le virement part automatiquement via Stripe. Continue comme ça.</p>` +
          button(`${siteUrl()}/dashboard`, "Voir mon dashboard"),
      );
      await sendEmail(callerTo, `RDV validé — ${formatEuros(meeting.payout_cents)} pour toi`, html);
    }

    // Email entreprise : récap du débit escrow
    const companyTo = await profileEmail(mission.company_id);
    if (companyTo) {
      const html = layout(
        heading("RDV validé") +
          `<p style="margin:0;">Le RDV avec <strong>${meeting.prospect_company}</strong> sur votre mission <strong>${mission.title}</strong> a été validé.</p>` +
          detailRows([["Montant débité de l'escrow", formatEuros(mission.price_per_meeting_cents)]]) +
          `<p style="margin:0;">Le caller est payé automatiquement, commission plateforme incluse dans ce montant.</p>` +
          button(`${siteUrl()}/entreprises/dashboard`, "Voir mon dashboard"),
      );
      await sendEmail(companyTo, `RDV validé — ${mission.title}`, html);
    }
  } catch (err) {
    console.error("emails RDV validé :", err);
  }
}

// =====================================================
// (d) Candidature acceptée → le caller
// =====================================================

export async function sendApplicationAcceptedEmail(assignmentId: string): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    const db = supabaseAdmin();
    const { data: assignment } = await db
      .from("assignments")
      .select("caller_id, missions!inner(title)")
      .eq("id", assignmentId)
      .single();
    if (!assignment) return false;
    const mission = assignment.missions as unknown as { title: string };

    const to = await profileEmail(assignment.caller_id);
    if (!to) return false;

    const html = layout(
      heading("Tu es sur la mission !") +
        `<p style="margin:0;">Ta candidature sur <strong>${mission.title}</strong> vient d'être acceptée. Tu peux commencer à caller.</p>` +
        `<p style="margin:16px 0 0;">Retrouve les notes de pitch, le ciblage et la déclaration de RDV depuis ton dashboard.</p>` +
        button(`${siteUrl()}/dashboard`, "Accéder à mon dashboard"),
    );
    return sendEmail(to, `Candidature acceptée — ${mission.title}`, html);
  } catch (err) {
    console.error("email candidature acceptée :", err);
    return false;
  }
}
