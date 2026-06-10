-- ColdKane — schéma initial
-- Marketplace gamifiée de cold callers : missions, escrow, RDV validés, classement saisonnier.

create extension if not exists "uuid-ossp";

-- =========================================================
-- Profils (les deux faces : caller / entreprise)
-- =========================================================

create type user_role as enum ('caller', 'company');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  full_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create table callers (
  profile_id uuid primary key references profiles (id) on delete cascade,
  headline text,
  -- points cumulés sur toute la vie du compte (le "CV vivant")
  lifetime_points integer not null default 0,
  lifetime_meetings_validated integer not null default 0,
  -- compte Stripe Connect Express pour les payouts
  stripe_account_id text,
  onboarding_score smallint check (onboarding_score between 0 and 100),
  created_at timestamptz not null default now()
);

create table companies (
  profile_id uuid primary key references profiles (id) on delete cascade,
  name text not null,
  website text,
  siren text,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Saisons & classement
-- =========================================================

create table seasons (
  id uuid primary key default uuid_generate_v4(),
  number integer not null unique,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default false,
  check (ends_at > starts_at)
);

-- un seul actif à la fois
create unique index seasons_one_active on seasons (is_active) where is_active;

create table season_scores (
  id uuid primary key default uuid_generate_v4(),
  season_id uuid not null references seasons (id) on delete cascade,
  caller_id uuid not null references callers (profile_id) on delete cascade,
  points integer not null default 0,
  meetings_validated integer not null default 0,
  no_shows integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  unique (season_id, caller_id)
);

create index season_scores_ladder on season_scores (season_id, points desc);

-- =========================================================
-- Missions & bounties
-- =========================================================

create type mission_status as enum ('draft', 'funded', 'active', 'completed', 'cancelled');

create table missions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies (profile_id) on delete cascade,
  title text not null,
  description text not null,
  sector text not null,
  target_persona text,
  status mission_status not null default 'draft',
  -- prix payé par RDV validé (en centimes)
  price_per_meeting_cents integer not null check (price_per_meeting_cents > 0),
  meetings_target integer not null check (meetings_target > 0),
  -- budget total séquestré = price * target (en centimes)
  budget_cents integer not null,
  escrow_payment_intent_id text,
  -- bounty = prime limitée dans le temps, mise en avant FOMO
  is_bounty boolean not null default false,
  bounty_deadline timestamptz,
  min_tier text, -- tier minimum requis pour postuler (filtre qualité)
  created_at timestamptz not null default now()
);

create index missions_open on missions (status, created_at desc);

create type assignment_status as enum ('applied', 'active', 'ended', 'rejected');

create table assignments (
  id uuid primary key default uuid_generate_v4(),
  mission_id uuid not null references missions (id) on delete cascade,
  caller_id uuid not null references callers (profile_id) on delete cascade,
  status assignment_status not null default 'applied',
  created_at timestamptz not null default now(),
  unique (mission_id, caller_id)
);

-- =========================================================
-- RDV (la preuve qui déclenche paiement + score)
-- =========================================================

create type meeting_status as enum ('booked', 'validated', 'no_show', 'disputed', 'cancelled');

create table meetings (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references assignments (id) on delete cascade,
  mission_id uuid not null references missions (id) on delete cascade,
  caller_id uuid not null references callers (profile_id) on delete cascade,
  -- prospect anonymisé côté public (RGPD) : on ne stocke que le nécessaire
  prospect_company text not null,
  prospect_contact_hash text, -- hash email pour dédup anti-farming, jamais affiché
  scheduled_at timestamptz not null,
  calendar_event_id text, -- preuve côté intégration calendrier
  status meeting_status not null default 'booked',
  validated_at timestamptz,
  validated_by uuid references profiles (id),
  payout_cents integer,
  stripe_transfer_id text,
  created_at timestamptz not null default now()
);

create index meetings_by_caller on meetings (caller_id, status);
create index meetings_by_mission on meetings (mission_id, status);
-- anti-farming : un même prospect ne compte qu'une fois par mission
create unique index meetings_dedup on meetings (mission_id, prospect_contact_hash)
  where prospect_contact_hash is not null and status <> 'cancelled';

-- =========================================================
-- Ledger escrow (chaque centime tracé)
-- =========================================================

create type transaction_type as enum ('deposit', 'release', 'commission', 'refund');

create table transactions (
  id uuid primary key default uuid_generate_v4(),
  mission_id uuid not null references missions (id),
  meeting_id uuid references meetings (id),
  type transaction_type not null,
  amount_cents integer not null,
  stripe_ref text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Badges (statut, le "crochet")
-- =========================================================

create table badges (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  label text not null,
  description text not null,
  icon text not null default '🏅'
);

create table caller_badges (
  caller_id uuid not null references callers (profile_id) on delete cascade,
  badge_id uuid not null references badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  season_id uuid references seasons (id),
  primary key (caller_id, badge_id)
);

-- =========================================================
-- RLS — lecture publique du ladder/profils, écriture contrôlée
-- =========================================================

alter table profiles enable row level security;
alter table callers enable row level security;
alter table companies enable row level security;
alter table seasons enable row level security;
alter table season_scores enable row level security;
alter table missions enable row level security;
alter table assignments enable row level security;
alter table meetings enable row level security;
alter table transactions enable row level security;
alter table badges enable row level security;
alter table caller_badges enable row level security;

-- Public : tout ce qui fait la réputation est lisible par tous
create policy "public read profiles" on profiles for select using (true);
create policy "public read callers" on callers for select using (true);
create policy "public read seasons" on seasons for select using (true);
create policy "public read season_scores" on season_scores for select using (true);
create policy "public read badges" on badges for select using (true);
create policy "public read caller_badges" on caller_badges for select using (true);
create policy "public read open missions" on missions for select
  using (status in ('funded', 'active', 'completed'));

-- Chacun gère son profil
create policy "own profile update" on profiles for update using (auth.uid() = id);
create policy "own profile insert" on profiles for insert with check (auth.uid() = id);
create policy "own caller row" on callers for all using (auth.uid() = profile_id);
create policy "own company row" on companies for all using (auth.uid() = profile_id);

-- Missions : l'entreprise gère les siennes
create policy "company own missions" on missions for all
  using (auth.uid() = company_id);

-- Assignments : visibles par les deux parties, créés par le caller
create policy "assignment parties read" on assignments for select
  using (
    auth.uid() = caller_id
    or auth.uid() = (select company_id from missions where id = mission_id)
  );
create policy "caller applies" on assignments for insert
  with check (auth.uid() = caller_id);

-- Meetings : visibles par les deux parties ; créés par le caller ;
-- la validation (status -> validated) passe par le service role uniquement
create policy "meeting parties read" on meetings for select
  using (
    auth.uid() = caller_id
    or auth.uid() = (select company_id from missions where id = mission_id)
  );
create policy "caller books meeting" on meetings for insert
  with check (auth.uid() = caller_id and status = 'booked');

-- Transactions : visibles par l'entreprise de la mission
create policy "company reads own transactions" on transactions for select
  using (auth.uid() = (select company_id from missions where id = mission_id));
