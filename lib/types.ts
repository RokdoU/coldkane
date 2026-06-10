export type Tier =
  | "bronze"
  | "argent"
  | "or"
  | "platine"
  | "diamant"
  | "legende";

export interface Season {
  id: string;
  number: number;
  name: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export interface CallerProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  lifetimePoints: number;
  lifetimeMeetingsValidated: number;
  badges: Badge[];
}

export interface Badge {
  slug: string;
  label: string;
  description: string;
  icon: string;
}

export interface LadderEntry {
  rank: number;
  caller: CallerProfile;
  points: number;
  meetingsValidated: number;
  noShows: number;
  bestStreak: number;
  tier: Tier;
}

export type MissionStatus =
  | "draft"
  | "funded"
  | "active"
  | "completed"
  | "cancelled";

export interface Mission {
  id: string;
  companyName: string;
  title: string;
  description: string;
  sector: string;
  status: MissionStatus;
  pricePerMeetingCents: number;
  meetingsTarget: number;
  meetingsValidated: number;
  budgetCents: number;
  isBounty: boolean;
  bountyDeadline: string | null;
  minTier: Tier | null;
  createdAt: string;
}

export type MeetingStatus =
  | "booked"
  | "validated"
  | "no_show"
  | "disputed"
  | "cancelled";

export interface Meeting {
  id: string;
  missionId: string;
  callerId: string;
  prospectCompany: string;
  scheduledAt: string;
  status: MeetingStatus;
  validatedAt: string | null;
  payoutCents: number | null;
}
