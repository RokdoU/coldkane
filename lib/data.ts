// Couche d'accès données : Supabase si configuré, sinon données de démo.
// Toutes les pages passent par ici — brancher la prod = poser les env vars.

import { isSupabaseConfigured, supabasePublic } from "./supabase";
import {
  mockCallerByUsername,
  mockLadder,
  mockMissions,
  mockSeason,
} from "./mock-data";
import type { LadderEntry, Mission, Season } from "./types";
import { tierForPoints } from "./ranking";

export async function getActiveSeason(): Promise<Season> {
  if (!isSupabaseConfigured()) return mockSeason;
  const { data } = await supabasePublic()
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .single();
  if (!data) return mockSeason;
  return {
    id: data.id,
    number: data.number,
    name: data.name,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    isActive: data.is_active,
  };
}

export async function getLadder(): Promise<LadderEntry[]> {
  if (!isSupabaseConfigured()) return mockLadder;
  const season = await getActiveSeason();
  const { data } = await supabasePublic()
    .from("season_scores")
    .select(
      `points, meetings_validated, no_shows, best_streak,
       callers!inner(profile_id, headline, lifetime_points, lifetime_meetings_validated,
         profiles!inner(username, full_name, avatar_url, bio))`,
    )
    .eq("season_id", season.id)
    .order("points", { ascending: false })
    .limit(100);
  if (!data || data.length === 0) return mockLadder;
  return data.map((row: Record<string, unknown>, i: number) => {
    const caller = row.callers as Record<string, unknown>;
    const profile = caller.profiles as Record<string, unknown>;
    return {
      rank: i + 1,
      caller: {
        id: caller.profile_id as string,
        username: profile.username as string,
        fullName: profile.full_name as string,
        avatarUrl: (profile.avatar_url as string) ?? null,
        headline: (caller.headline as string) ?? null,
        bio: (profile.bio as string) ?? null,
        lifetimePoints: caller.lifetime_points as number,
        lifetimeMeetingsValidated: caller.lifetime_meetings_validated as number,
        badges: [],
      },
      points: row.points as number,
      meetingsValidated: row.meetings_validated as number,
      noShows: row.no_shows as number,
      bestStreak: row.best_streak as number,
      tier: tierForPoints(row.points as number, i + 1),
    };
  });
}

export async function getCallerByUsername(username: string): Promise<LadderEntry | null> {
  if (!isSupabaseConfigured()) return mockCallerByUsername(username);
  const ladder = await getLadder();
  return ladder.find((e) => e.caller.username === username) ?? null;
}

function rowToMission(row: Record<string, unknown>): Mission {
  return {
    id: row.id as string,
    companyName: (row.companies as { name: string }).name,
    title: row.title as string,
    description: row.description as string,
    sector: row.sector as string,
    status: row.status as Mission["status"],
    pricePerMeetingCents: row.price_per_meeting_cents as number,
    meetingsTarget: row.meetings_target as number,
    meetingsValidated: ((row.meetings as { status: string }[]) ?? []).filter(
      (m) => m.status === "validated",
    ).length,
    budgetCents: row.budget_cents as number,
    isBounty: row.is_bounty as boolean,
    bountyDeadline: (row.bounty_deadline as string) ?? null,
    minTier: (row.min_tier as Mission["minTier"]) ?? null,
    createdAt: row.created_at as string,
    targetPersona: (row.target_persona as string) ?? null,
    meetingType: (row.meeting_type as string) ?? null,
    pitchNotes: (row.pitch_notes as string) ?? null,
  };
}

export async function getOpenMissions(): Promise<Mission[]> {
  if (!isSupabaseConfigured()) return mockMissions;
  const { data } = await supabasePublic()
    .from("missions")
    .select("*, companies!inner(name), meetings(status)")
    .in("status", ["funded", "active"])
    .order("is_bounty", { ascending: false })
    .order("created_at", { ascending: false });
  if (!data || data.length === 0) return mockMissions;
  return data.map((row: Record<string, unknown>) => rowToMission(row));
}

export async function getMissionById(id: string): Promise<Mission | null> {
  if (!isSupabaseConfigured()) {
    return mockMissions.find((m) => m.id === id) ?? null;
  }
  const { data } = await supabasePublic()
    .from("missions")
    .select("*, companies!inner(name), meetings(status)")
    .eq("id", id)
    .single();
  if (!data) return null;
  return rowToMission(data as Record<string, unknown>);
}

// =====================================================
// Kill feed : dernières validations publiques
// =====================================================

export interface ValidationEvent {
  id: string;
  callerUsername: string;
  companyName: string;
  payoutCents: number;
  validatedAt: string;
}

export async function getRecentValidations(): Promise<ValidationEvent[]> {
  if (!isSupabaseConfigured()) {
    // Démo : événements plausibles, étalés sur les dernières heures
    const events: Array<[string, string, number, number]> = [
      ["sashaclose", "Hexalift", 21250, 8],
      ["karim_dial", "Nexa CRM", 12750, 23],
      ["lea.outbound", "Studio Karma", 7650, 51],
      ["ninacalls", "Hexalift", 21250, 78],
      ["sashaclose", "Nexa CRM", 12750, 117],
      ["tomdialer", "Studio Karma", 7650, 164],
    ];
    return events.map(([username, company, cents, minAgo], i) => ({
      id: `demo-v${i}`,
      callerUsername: username,
      companyName: company,
      payoutCents: cents,
      validatedAt: new Date(Date.now() - minAgo * 60_000).toISOString(),
    }));
  }
  const { data } = await supabasePublic()
    .from("recent_validations")
    .select("*")
    .limit(12);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    callerUsername: row.caller_username as string,
    companyName: row.company_name as string,
    payoutCents: row.payout_cents as number,
    validatedAt: row.validated_at as string,
  }));
}

// =====================================================
// Rival : le joueur juste au-dessus au classement
// =====================================================

export interface RivalInfo {
  rivalUsername: string;
  pointsGap: number;
  myRank: number;
  daysLeft: number;
}

export async function getRivalInfo(username: string | null): Promise<RivalInfo | null> {
  const [ladder, season] = await Promise.all([getLadder(), getActiveSeason()]);
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(season.endsAt).getTime() - Date.now()) / 86_400_000),
  );

  // Démo : pas de session — on montre la mécanique depuis le rang 6
  const myIndex = username
    ? ladder.findIndex((e) => e.caller.username === username)
    : 5;
  if (myIndex <= 0) return null; // introuvable ou déjà n°1

  const me = ladder[myIndex];
  const above = ladder[myIndex - 1];
  return {
    rivalUsername: above.caller.username,
    pointsGap: above.points - me.points + 1,
    myRank: me.rank,
    daysLeft,
  };
}
