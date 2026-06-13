-- =========================================================
-- 006 — Lockdown RLS : colonnes "argent/score/rôle"
-- non modifiables par un client. Tout passe par RPC ou service role.
-- =========================================================

-- CALLERS : seul le headline est éditable par le caller.
-- lifetime_points, lifetime_meetings_validated, stripe_account_id,
-- payouts_enabled, onboarding_score → service role uniquement.
revoke update on table callers from authenticated, anon;
grant update (headline) on table callers to authenticated;

-- PROFILES : identité éditoriale seulement.
-- username et role figés (portent la réputation + les URLs /c/).
revoke update on table profiles from authenticated, anon;
grant update (full_name, avatar_url, bio) on table profiles to authenticated;

-- COMPANIES : infos publiques éditables, jamais les champs Stripe.
revoke update on table companies from authenticated, anon;
grant update (name, website, siren) on table companies to authenticated;

-- MISSIONS : champs éditoriaux uniquement.
-- status, price_per_meeting_cents, budget_cents, escrow_payment_intent_id,
-- is_bounty, bounty_deadline → service role uniquement.
revoke update on table missions from authenticated, anon;
grant update (title, description, sector, target_persona, meeting_type, pitch_notes)
  on table missions to authenticated;

-- ASSIGNMENTS : seul status est modifiable (accepter/refuser une candidature).
revoke update on table assignments from authenticated, anon;
grant update (status) on table assignments to authenticated;

-- MEETINGS : plus d'INSERT direct — la déclaration passe par la RPC
-- declare_meeting (garde anti-overbooking + sérialisation).
revoke insert, update on table meetings from authenticated, anon;
drop policy if exists "caller books meeting" on meetings;

-- TRANSACTIONS : lecture seule pour tout le monde sauf service role.
revoke insert, update, delete on table transactions from authenticated, anon;

-- =========================================================
-- Colonne payouts_enabled : tracke l'état réel du compte Connect
-- (mis à jour par le webhook account.updated).
-- =========================================================
alter table callers add column if not exists payouts_enabled boolean not null default false;

-- =========================================================
-- RPC declare_meeting : déclaration de RDV avec garde anti-overbooking.
-- Sérialise les déclarations concurrentes via SELECT ... FOR UPDATE sur
-- la mission. Retourne le meeting créé ou lève une exception.
-- =========================================================
create or replace function declare_meeting(
  p_assignment_id uuid,
  p_prospect_company text,
  p_contact_hash text,
  p_scheduled_at timestamptz
) returns meetings
language plpgsql
security definer
as $$
declare
  v_assignment assignments;
  v_mission    missions;
  v_open_count integer;
  v_meeting    meetings;
begin
  select * into v_assignment
  from assignments
  where id = p_assignment_id
    and caller_id = auth.uid()
    and status = 'active';
  if not found then
    raise exception 'Candidature inactive ou non autorisée';
  end if;

  -- Verrou sur la mission : sérialise les déclarations concurrentes
  select * into v_mission
  from missions
  where id = v_assignment.mission_id
  for update;

  if v_mission.status not in ('funded', 'active') then
    raise exception 'Mission non active (status : %)', v_mission.status;
  end if;

  -- Un RDV disputed réserve sa place dans le budget : le litige est un état
  -- suspensif, pas une annulation. Invariant : booked + validated + disputed
  -- <= meetings_target à tout instant — donc une mission ne peut jamais
  -- passer 'completed' avec un litige en suspens (le cas « arbitrage validated
  -- sur mission completed » est structurellement impossible).
  select count(*) into v_open_count
  from meetings
  where mission_id = v_mission.id
    and status in ('booked', 'validated', 'disputed');
  if v_open_count >= v_mission.meetings_target then
    raise exception 'Objectif de RDV atteint sur cette mission';
  end if;

  insert into meetings (
    assignment_id, mission_id, caller_id,
    prospect_company, prospect_contact_hash,
    scheduled_at, status
  )
  values (
    v_assignment.id, v_mission.id, auth.uid(),
    p_prospect_company, p_contact_hash,
    p_scheduled_at, 'booked'
  )
  returning * into v_meeting;

  return v_meeting;
end;
$$;

-- Seuls les callers authentifiés peuvent appeler cette fonction.
-- (revoke from public obligatoire : Postgres accorde EXECUTE à public
-- par défaut, anon en hériterait silencieusement)
revoke execute on function declare_meeting from public, anon;
grant execute on function declare_meeting to authenticated;
