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

export async function getOpenMissions(): Promise<Mission[]> {
  if (!isSupabaseConfigured()) return mockMissions;
  const { data } = await supabasePublic()
    .from("missions")
    .select("*, companies!inner(name), meetings(status)")
    .in("status", ["funded", "active"])
    .order("is_bounty", { ascending: false })
    .order("created_at", { ascending: false });
  if (!data || data.length === 0) return mockMissions;
  return data.map((row: Record<string, unknown>) => ({
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
  }));
}
