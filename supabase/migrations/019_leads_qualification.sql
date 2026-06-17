-- =========================================================
-- 019 — Flux entreprise : RDV qualifié, booking, pool de leads (hybride).
-- Décisions produit (2026-06-17) :
--   - paiement AU RDV QUALIFIÉ (modèle actuel inchangé)
--   - sourcing HYBRIDE : persona obligatoire + liste de comptes optionnelle,
--     que les callers réservent (lock anti-doublon)
--   - le RDV se book dans le calendrier de l'entreprise (lien par mission)
-- =========================================================

-- Critères contractuels du « RDV qualifié » + lien de booking de l'entreprise.
alter table missions
  add column if not exists qualification_criteria text,
  add column if not exists booking_url text;

comment on column missions.qualification_criteria is
  'Ce qui fait qu''un RDV compte comme qualifié (décideur, budget, besoin, timing) — base de validation/litige';
comment on column missions.booking_url is
  'Lien de réservation de l''entreprise (Calendly/agenda) : le RDV se book dans SON calendrier';

-- =========================================================
-- Pool de leads (hybride). Niveau COMPTE, pas de contact perso en clair (RGPD) :
-- nom du compte cible + indice (poste/ville) + notes. Un caller réserve un lead
-- avant de l'appeler pour éviter que deux callers crament le même prospect.
-- =========================================================
create type lead_status as enum ('available', 'claimed', 'contacted', 'closed');

create table leads (
  id uuid primary key default uuid_generate_v4(),
  mission_id uuid not null references missions (id) on delete cascade,
  account_name text not null,
  contact_hint text,          -- ex : « DAF », « région lyonnaise » — jamais un email
  notes text,
  status lead_status not null default 'available',
  claimed_by uuid references callers (profile_id),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index leads_mission on leads (mission_id, status);

-- Lien RDV ↔ lead réservé (null si le caller a sourcé hors pool)
alter table meetings
  add column if not exists lead_id uuid references leads (id);

-- =========================================================
-- RLS
-- =========================================================
alter table leads enable row level security;

-- L'entreprise gère les leads de SES missions (ajout/édition/suppression).
create policy "company manages own leads" on leads for all
  using (auth.uid() = (select company_id from missions where id = mission_id));

-- Un caller actif sur la mission voit le pool (pour réserver). La réservation
-- elle-même passe par claim_lead (jamais un UPDATE client direct).
create policy "active caller reads mission leads" on leads for select
  using (
    exists (
      select 1 from assignments a
      where a.mission_id = leads.mission_id
        and a.caller_id = auth.uid()
        and a.status = 'active'
    )
  );

-- =========================================================
-- claim_lead : réservation atomique d'un lead par un caller actif.
-- =========================================================
create or replace function claim_lead(p_lead_id uuid) returns leads
language plpgsql
security definer
as $$
declare
  v_lead leads;
begin
  select * into v_lead from leads where id = p_lead_id for update;
  if not found then
    raise exception 'Lead introuvable';
  end if;
  if v_lead.status <> 'available' then
    raise exception 'Lead déjà réservé';
  end if;
  if not exists (
    select 1 from assignments
    where mission_id = v_lead.mission_id and caller_id = auth.uid() and status = 'active'
  ) then
    raise exception 'Tu dois être actif sur cette mission pour réserver un lead';
  end if;

  update leads
  set status = 'claimed', claimed_by = auth.uid(), claimed_at = now()
  where id = p_lead_id
  returning * into v_lead;
  return v_lead;
end;
$$;

revoke execute on function claim_lead(uuid) from public, anon;
grant execute on function claim_lead(uuid) to authenticated;

-- release_lead : le caller relâche un lead qu'il avait réservé (remis au pool).
create or replace function release_lead(p_lead_id uuid) returns leads
language plpgsql
security definer
as $$
declare
  v_lead leads;
begin
  select * into v_lead from leads where id = p_lead_id for update;
  if not found or v_lead.claimed_by <> auth.uid() then
    raise exception 'Lead introuvable ou non réservé par toi';
  end if;
  if v_lead.status = 'contacted' then
    raise exception 'Lead déjà contacté (RDV déclaré), impossible de le relâcher';
  end if;

  update leads
  set status = 'available', claimed_by = null, claimed_at = null
  where id = p_lead_id
  returning * into v_lead;
  return v_lead;
end;
$$;

revoke execute on function release_lead(uuid) from public, anon;
grant execute on function release_lead(uuid) to authenticated;

-- link_meeting_lead : rattache un RDV déclaré à un lead réservé + passe le lead
-- en 'contacted'. Vérifie que le RDV et le lead appartiennent bien au caller.
create or replace function link_meeting_lead(p_meeting_id uuid, p_lead_id uuid) returns void
language plpgsql
security definer
as $$
declare
  v_lead leads;
begin
  if not exists (
    select 1 from meetings where id = p_meeting_id and caller_id = auth.uid()
  ) then
    raise exception 'RDV introuvable ou non autorisé';
  end if;
  select * into v_lead from leads where id = p_lead_id for update;
  if not found or v_lead.claimed_by <> auth.uid() then
    raise exception 'Lead introuvable ou non réservé par toi';
  end if;

  update meetings set lead_id = p_lead_id where id = p_meeting_id;
  update leads set status = 'contacted' where id = p_lead_id;
end;
$$;

revoke execute on function link_meeting_lead(uuid, uuid) from public, anon;
grant execute on function link_meeting_lead(uuid, uuid) to authenticated;
