-- =========================================================
-- 016 — Démarrage progressif (earn-as-you-go) : filtre qualité autonome.
-- declare_meeting recréée pour plafonner le nombre de RDV ouverts simultanés
-- d'un caller (booked + disputed, toutes missions confondues), plafond débloqué
-- par sa performance (RDV validés à vie). Les bons montent en accès tout seuls,
-- les mauvais se tarissent — zéro validation humaine.
-- Les bornes viennent de lib/config.ts (EARN_AS_YOU_GO), passées en paramètres
-- pour garder la config comme source de vérité unique.
-- Le reste (garde anti-overbooking, sérialisation) est inchangé vs 006.
-- =========================================================
create or replace function declare_meeting(
  p_assignment_id uuid,
  p_prospect_company text,
  p_contact_hash text,
  p_scheduled_at timestamptz,
  p_base_open integer default 3,
  p_unlock_per integer default 1,
  p_max_open integer default 25
) returns meetings
language plpgsql
security definer
as $$
declare
  v_assignment assignments;
  v_mission    missions;
  v_open_count integer;
  v_caller_open integer;
  v_validated  integer;
  v_cap        integer;
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

  -- Plafond earn-as-you-go : RDV ouverts du caller toutes missions confondues
  select lifetime_meetings_validated into v_validated
  from callers where profile_id = auth.uid();
  v_cap := least(p_max_open, p_base_open + coalesce(v_validated, 0) * p_unlock_per);

  select count(*) into v_caller_open
  from meetings
  where caller_id = auth.uid()
    and status in ('booked', 'disputed');
  if v_caller_open >= v_cap then
    raise exception 'Plafond de RDV ouverts atteint (%). Fais valider tes RDV en cours pour débloquer plus.', v_cap;
  end if;

  -- Verrou sur la mission : sérialise les déclarations concurrentes
  select * into v_mission
  from missions
  where id = v_assignment.mission_id
  for update;

  if v_mission.status not in ('funded', 'active') then
    raise exception 'Mission non active (status : %)', v_mission.status;
  end if;

  -- Un RDV disputed réserve sa place dans le budget : invariant
  -- booked + validated + disputed <= meetings_target (cf. 006).
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

revoke execute on function declare_meeting(uuid, text, text, timestamptz, integer, integer, integer)
  from public, anon;
grant execute on function declare_meeting(uuid, text, text, timestamptz, integer, integer, integer)
  to authenticated;
