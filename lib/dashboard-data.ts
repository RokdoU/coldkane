// Données des dashboards. Mode démo : données fictives pour montrer le produit.

import { isSupabaseConfigured } from "./supabase";
import { supabaseServer } from "./supabase-server";
import type { MeetingStatus, Lead, LeadStatus } from "./types";

export interface CallerAssignment {
  id: string;
  missionId: string;
  missionTitle: string;
  companyName: string;
  pricePerMeetingCents: number;
  status: "applied" | "active" | "ended" | "rejected";
  bookingUrl: string | null;
  qualificationCriteria: string | null;
}

export interface CallerMeeting {
  id: string;
  missionTitle: string;
  prospectCompany: string;
  scheduledAt: string;
  status: MeetingStatus;
  payoutCents: number | null;
  disputeReason: string | null;
  callerEvidence: string | null;
}

export interface CallerDashboard {
  demo: boolean;
  assignments: CallerAssignment[];
  meetings: CallerMeeting[];
  totalEarnedCents: number;
  pendingMeetings: number;
  hasStripeAccount: boolean;
  // URL externe de la vidéo de pitch (preuve sociale optionnelle), null si non renseignée
  pitchVideoUrl: string | null;
  // Pool de leads des missions actives : disponibles (à réserver) + réservés par moi
  leads: Lead[];
}

export async function getCallerDashboard(userId: string | null): Promise<CallerDashboard> {
  if (!isSupabaseConfigured() || !userId) {
    return {
      demo: true,
      assignments: [
        {
          id: "demo-a1",
          missionId: "m1",
          missionTitle: "RDV démo pour CRM SaaS — cible DAF de PME",
          companyName: "Nexa CRM",
          pricePerMeetingCents: 15000,
          status: "active",
          bookingUrl: "https://calendly.com/coldkane-demo/rdv-qualifie",
          qualificationCriteria:
            "Décideur présent (DAF/DG), besoin réel exprimé, horizon d'achat < 6 mois.",
        },
        {
          id: "demo-a2",
          missionId: "m2",
          missionTitle: "10 RDV qualifiés secteur logistique avant dimanche",
          companyName: "Hexalift",
          pricePerMeetingCents: 25000,
          status: "applied",
          bookingUrl: null,
          qualificationCriteria: null,
        },
      ],
      meetings: [
        {
          id: "demo-m1",
          missionTitle: "RDV démo pour CRM SaaS",
          prospectCompany: "Groupe Vidal",
          scheduledAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
          status: "booked",
          payoutCents: null,
          disputeReason: null,
          callerEvidence: null,
        },
        {
          id: "demo-m2",
          missionTitle: "RDV démo pour CRM SaaS",
          prospectCompany: "Atelier Nord",
          scheduledAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
          status: "validated",
          payoutCents: 12750,
          disputeReason: null,
          callerEvidence: null,
        },
        {
          id: "demo-m3",
          missionTitle: "RDV démo pour CRM SaaS",
          prospectCompany: "Foncia Lyon",
          scheduledAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
          status: "disputed",
          payoutCents: null,
          disputeReason: "Le prospect dit n'avoir jamais confirmé ce créneau.",
          callerEvidence: null,
        },
      ],
      totalEarnedCents: 38250,
      pendingMeetings: 1,
      hasStripeAccount: false,
      pitchVideoUrl: "https://www.tiktok.com/@sashaclose/video/7300000000000000000",
      leads: [
        {
          id: "demo-l1",
          missionId: "m1",
          missionTitle: "RDV démo pour CRM SaaS — cible DAF de PME",
          accountName: "Groupe Méridien (négoce BTP)",
          contactHint: "DAF · région lyonnaise",
          notes: "Utilise encore Excel d'après leur offre d'emploi récente.",
          status: "available",
        },
        {
          id: "demo-l2",
          missionId: "m1",
          missionTitle: "RDV démo pour CRM SaaS — cible DAF de PME",
          accountName: "Atelier Nord SAS",
          contactHint: "DG",
          notes: null,
          status: "claimed",
        },
      ],
    };
  }

  const supabase = await supabaseServer();
  const [{ data: assignments }, { data: meetings }, { data: caller }] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        "id, status, missions!inner(id, title, price_per_meeting_cents, booking_url, qualification_criteria, companies!inner(name))",
      )
      .eq("caller_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("meetings")
      .select(
        "id, prospect_company, scheduled_at, status, payout_cents, dispute_reason, caller_evidence, missions!inner(title)",
      )
      .eq("caller_id", userId)
      .order("scheduled_at", { ascending: false })
      .limit(30),
    supabase
      .from("callers")
      .select("stripe_account_id, pitch_video_url")
      .eq("profile_id", userId)
      .single(),
  ]);

  const mappedMeetings: CallerMeeting[] = (meetings ?? []).map(
    (m: Record<string, unknown>) => ({
      id: m.id as string,
      missionTitle: (m.missions as { title: string }).title,
      prospectCompany: m.prospect_company as string,
      scheduledAt: m.scheduled_at as string,
      status: m.status as MeetingStatus,
      payoutCents: (m.payout_cents as number) ?? null,
      disputeReason: (m.dispute_reason as string) ?? null,
      callerEvidence: (m.caller_evidence as string) ?? null,
    }),
  );

  const mappedAssignments: CallerAssignment[] = (assignments ?? []).map(
    (a: Record<string, unknown>) => {
      const mission = a.missions as {
        id: string;
        title: string;
        price_per_meeting_cents: number;
        booking_url: string | null;
        qualification_criteria: string | null;
        companies: { name: string };
      };
      return {
        id: a.id as string,
        missionId: mission.id,
        missionTitle: mission.title,
        companyName: mission.companies.name,
        pricePerMeetingCents: mission.price_per_meeting_cents,
        status: a.status as CallerAssignment["status"],
        bookingUrl: mission.booking_url ?? null,
        qualificationCriteria: mission.qualification_criteria ?? null,
      };
    },
  );

  // Pool de leads des missions actives : disponibles + ceux que j'ai réservés
  const activeMissionIds = mappedAssignments
    .filter((a) => a.status === "active")
    .map((a) => a.missionId);
  const titleByMission = new Map(mappedAssignments.map((a) => [a.missionId, a.missionTitle]));
  let leads: Lead[] = [];
  if (activeMissionIds.length > 0) {
    const { data: leadRows } = await supabase
      .from("leads")
      .select("id, mission_id, account_name, contact_hint, notes, status, claimed_by")
      .in("mission_id", activeMissionIds)
      .or(`status.eq.available,claimed_by.eq.${userId}`)
      .order("created_at", { ascending: true });
    leads = (leadRows ?? []).map((l: Record<string, unknown>) => ({
      id: l.id as string,
      missionId: l.mission_id as string,
      missionTitle: titleByMission.get(l.mission_id as string) ?? "",
      accountName: l.account_name as string,
      contactHint: (l.contact_hint as string) ?? null,
      notes: (l.notes as string) ?? null,
      status: l.status as LeadStatus,
    }));
  }

  return {
    demo: false,
    assignments: mappedAssignments,
    meetings: mappedMeetings,
    totalEarnedCents: mappedMeetings
      .filter((m) => m.status === "validated")
      .reduce((sum, m) => sum + (m.payoutCents ?? 0), 0),
    pendingMeetings: mappedMeetings.filter((m) => m.status === "booked").length,
    hasStripeAccount: Boolean(caller?.stripe_account_id),
    pitchVideoUrl: (caller?.pitch_video_url as string) ?? null,
    leads,
  };
}

export interface CompanyMission {
  id: string;
  title: string;
  status: string;
  pricePerMeetingCents: number;
  meetingsTarget: number;
  meetingsValidated: number;
  budgetCents: number;
  leadsTotal: number;
  leadsAvailable: number;
}

export interface CompanyApplication {
  id: string;
  missionTitle: string;
  callerUsername: string;
  callerPoints: number;
}

export interface CompanyMeeting {
  id: string;
  missionTitle: string;
  callerUsername: string;
  prospectCompany: string;
  scheduledAt: string;
  status: MeetingStatus;
  autoValidateAt: string | null;
}

export interface CompanyDashboard {
  demo: boolean;
  missions: CompanyMission[];
  applications: CompanyApplication[];
  meetingsToReview: CompanyMeeting[];
  spentCents: number;
}

export async function getCompanyDashboard(userId: string | null): Promise<CompanyDashboard> {
  if (!isSupabaseConfigured() || !userId) {
    return {
      demo: true,
      missions: [
        {
          id: "demo-mi1",
          title: "RDV démo pour CRM SaaS — cible DAF de PME",
          status: "active",
          pricePerMeetingCents: 15000,
          meetingsTarget: 20,
          meetingsValidated: 13,
          budgetCents: 300000,
          leadsTotal: 24,
          leadsAvailable: 9,
        },
      ],
      applications: [
        {
          id: "demo-ap1",
          missionTitle: "RDV démo pour CRM SaaS",
          callerUsername: "ninacalls",
          callerPoints: 1980,
        },
      ],
      meetingsToReview: [
        {
          id: "demo-me1",
          missionTitle: "RDV démo pour CRM SaaS",
          callerUsername: "sashaclose",
          prospectCompany: "Groupe Vidal",
          scheduledAt: new Date(Date.now() - 86_400_000).toISOString(),
          status: "booked",
          autoValidateAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
        },
      ],
      spentCents: 195000,
    };
  }

  const supabase = await supabaseServer();
  const [{ data: missions }, { data: applications }, { data: meetings }, { data: released }] =
    await Promise.all([
      supabase
        .from("missions")
        .select(
          "id, title, status, price_per_meeting_cents, meetings_target, budget_cents, meetings(status), leads(status)",
        )
        .eq("company_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("assignments")
        .select(
          "id, missions!inner(title, company_id), callers!inner(lifetime_points, profiles!inner(username))",
        )
        .eq("status", "applied")
        .eq("missions.company_id", userId),
      supabase
        .from("meetings")
        .select(
          "id, prospect_company, scheduled_at, status, auto_validate_at, missions!inner(title, company_id), callers!inner(profiles!inner(username))",
        )
        .eq("missions.company_id", userId)
        .in("status", ["booked", "disputed"])
        .order("scheduled_at", { ascending: true }),
      supabase
        .from("transactions")
        .select("amount_cents, missions!inner(company_id)")
        .eq("missions.company_id", userId)
        .in("type", ["release", "commission"]),
    ]);

  return {
    demo: false,
    missions: (missions ?? []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      title: m.title as string,
      status: m.status as string,
      pricePerMeetingCents: m.price_per_meeting_cents as number,
      meetingsTarget: m.meetings_target as number,
      meetingsValidated: ((m.meetings as { status: string }[]) ?? []).filter(
        (x) => x.status === "validated",
      ).length,
      budgetCents: m.budget_cents as number,
      leadsTotal: ((m.leads as { status: string }[]) ?? []).length,
      leadsAvailable: ((m.leads as { status: string }[]) ?? []).filter(
        (x) => x.status === "available",
      ).length,
    })),
    applications: (applications ?? []).map((a: Record<string, unknown>) => {
      const caller = a.callers as {
        lifetime_points: number;
        profiles: { username: string };
      };
      return {
        id: a.id as string,
        missionTitle: (a.missions as { title: string }).title,
        callerUsername: caller.profiles.username,
        callerPoints: caller.lifetime_points,
      };
    }),
    meetingsToReview: (meetings ?? []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      missionTitle: (m.missions as { title: string }).title,
      callerUsername: (m.callers as { profiles: { username: string } }).profiles.username,
      prospectCompany: m.prospect_company as string,
      scheduledAt: m.scheduled_at as string,
      status: m.status as MeetingStatus,
      autoValidateAt: (m.auto_validate_at as string) ?? null,
    })),
    spentCents: (released ?? []).reduce(
      (sum: number, t: Record<string, unknown>) => sum + (t.amount_cents as number),
      0,
    ),
  };
}
