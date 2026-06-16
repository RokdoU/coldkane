-- =========================================================
-- 013 — Anti-abus / anti-fraude (plateforme self-service, argent réel).
--
-- Principe : détection AUTOMATIQUE = flag + alerte, JAMAIS blocage silencieux.
-- Personne ne surveille à l'œil : on trace les signaux (fraud_flags) et on
-- refuse proprement seulement les abus de débit (rate limiting login + plafond
-- de déclarations). Le reste (multi-comptes, collusion) est tracé pour revue.
--
-- RÈGLE D'ÉQUIPE (cf. 011/012) : aucune fonction security definer n'est créée
-- ici. Ces tables sont purement « back-office » : RLS activée SANS policy →
-- seul le service role y accède. Aucun grant à anon/authenticated.
-- Tout passe par supabaseAdmin() côté serveur (lib/fraud.ts).
-- =========================================================

-- =========================================================
-- auth_attempts : trace des tentatives de connexion pour le rate limiting.
-- On garde l'identifiant (email saisi) ET l'IP : un attaquant fait varier
-- l'un ou l'autre, on plafonne sur les deux axes côté app.
-- =========================================================
create table auth_attempts (
  id uuid primary key default uuid_generate_v4(),
  identifier text,                       -- email/identifiant saisi (jamais une donnée prospect)
  ip text,                               -- IP source (x-forwarded-for, cf. lib/fraud.ts)
  success boolean not null,              -- tentative réussie ou non
  created_at timestamptz not null default now()
);

-- Lecture du rate limit : « échecs récents pour cet identifiant ou cette IP ».
create index auth_attempts_lookup on auth_attempts (created_at desc, success)
  where success = false;

-- =========================================================
-- fraud_flags : signaux de fraude détectés (multi-comptes, collusion…).
-- C'est une TRACE, pas un blocage : resolved passe à true après revue manuelle.
-- subject_meeting_id / subject_profile_id : la cible du signal (l'un, l'autre,
-- ou les deux selon le kind). details (jsonb) porte le contexte brut.
-- =========================================================
create table fraud_flags (
  id uuid primary key default uuid_generate_v4(),
  kind text not null,                    -- 'multi_account' | 'collusion' | …
  subject_meeting_id uuid references meetings (id) on delete cascade,
  subject_profile_id uuid references profiles (id) on delete cascade,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);

create index fraud_flags_open on fraud_flags (created_at desc) where not resolved;
create index fraud_flags_by_kind on fraud_flags (kind, created_at desc);

-- =========================================================
-- profiles : empreinte d'inscription (détection multi-comptes + collusion).
-- signup_ip est aussi comparée entre caller et entreprise d'une mission pour
-- repérer une collusion (même origine d'inscription).
-- =========================================================
alter table profiles
  add column if not exists signup_ip text,
  add column if not exists signup_user_agent text;

comment on column profiles.signup_ip is 'IP capturée à l''inscription — détection multi-comptes / collusion (back-office, jamais exposée client)';
comment on column profiles.signup_user_agent is 'User-Agent capturé à l''inscription — signal multi-comptes (back-office)';

-- Recherche « autres comptes créés depuis cette IP sur 24h ».
create index profiles_signup_ip on profiles (signup_ip, created_at desc)
  where signup_ip is not null;

-- =========================================================
-- RLS : ces deux tables ne sont JAMAIS lisibles/écrites par un client.
-- enable row level security + AUCUNE policy = tout client (anon/authenticated)
-- est bloqué ; seul le service role (qui bypasse la RLS) y accède.
-- =========================================================
alter table auth_attempts enable row level security;
alter table fraud_flags enable row level security;

-- Ceinture + bretelles : on révoque explicitement tout accès table aux rôles
-- clients (la capture signup_ip et les flags transitent par supabaseAdmin).
revoke all on table auth_attempts from anon, authenticated;
revoke all on table fraud_flags from anon, authenticated;
