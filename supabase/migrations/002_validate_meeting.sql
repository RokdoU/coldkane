-- Validation d'un RDV : la transaction critique du système.
-- Déclenchée côté serveur (service role) quand la preuve calendrier est confirmée.
-- Atomique : score + ledger + compteurs dans une seule transaction SQL.

create or replace function validate_meeting(
  p_meeting_id uuid,
  p_validated_by uuid,
  p_commission_rate numeric default 0.15
) returns meetings
language plpgsql
security definer
as $$
declare
  v_meeting meetings;
  v_mission missions;
  v_season_id uuid;
  v_points integer := 100; -- points de base par RDV validé
  v_streak integer;
  v_payout integer;
  v_commission integer;
begin
  select * into v_meeting from meetings where id = p_meeting_id for update;
  if not found then
    raise exception 'meeting % introuvable', p_meeting_id;
  end if;
  if v_meeting.status <> 'booked' then
    raise exception 'meeting % non validable (status %)', p_meeting_id, v_meeting.status;
  end if;

  select * into v_mission from missions where id = v_meeting.mission_id for update;
  if v_mission.status not in ('funded', 'active') then
    raise exception 'mission % non active', v_mission.id;
  end if;

  v_commission := round(v_mission.price_per_meeting_cents * p_commission_rate);
  v_payout := v_mission.price_per_meeting_cents - v_commission;

  -- 1. le RDV passe validé
  update meetings
  set status = 'validated',
      validated_at = now(),
      validated_by = p_validated_by,
      payout_cents = v_payout
  where id = p_meeting_id
  returning * into v_meeting;

  -- 2. ledger escrow
  insert into transactions (mission_id, meeting_id, type, amount_cents)
  values
    (v_mission.id, p_meeting_id, 'release', v_payout),
    (v_mission.id, p_meeting_id, 'commission', v_commission);

  -- 3. score de saison (streak : +10 pts par RDV consécutif, plafonné à +50)
  select id into v_season_id from seasons where is_active limit 1;
  if v_season_id is not null then
    insert into season_scores (season_id, caller_id, points, meetings_validated, current_streak, best_streak)
    values (v_season_id, v_meeting.caller_id, 0, 0, 0, 0)
    on conflict (season_id, caller_id) do nothing;

    select current_streak + 1 into v_streak
    from season_scores
    where season_id = v_season_id and caller_id = v_meeting.caller_id;

    v_points := v_points + least((v_streak - 1) * 10, 50);

    update season_scores
    set points = points + v_points,
        meetings_validated = meetings_validated + 1,
        current_streak = v_streak,
        best_streak = greatest(best_streak, v_streak)
    where season_id = v_season_id and caller_id = v_meeting.caller_id;
  end if;

  -- 4. stats lifetime (le CV vivant)
  update callers
  set lifetime_points = lifetime_points + v_points,
      lifetime_meetings_validated = lifetime_meetings_validated + 1
  where profile_id = v_meeting.caller_id;

  -- 5. mission complétée si l'objectif est atteint
  if (select count(*) from meetings where mission_id = v_mission.id and status = 'validated')
     >= v_mission.meetings_target then
    update missions set status = 'completed' where id = v_mission.id;
  end if;

  return v_meeting;
end;
$$;

-- No-show : casse le streak, pénalité légère (l'intégrité du ladder avant tout)
create or replace function mark_no_show(p_meeting_id uuid) returns void
language plpgsql
security definer
as $$
declare
  v_meeting meetings;
  v_season_id uuid;
begin
  select * into v_meeting from meetings where id = p_meeting_id for update;
  if v_meeting.status <> 'booked' then
    raise exception 'meeting % non marquable no-show', p_meeting_id;
  end if;

  update meetings set status = 'no_show' where id = p_meeting_id;

  select id into v_season_id from seasons where is_active limit 1;
  if v_season_id is not null then
    update season_scores
    set points = greatest(points - 30, 0),
        no_shows = no_shows + 1,
        current_streak = 0
    where season_id = v_season_id and caller_id = v_meeting.caller_id;
  end if;
end;
$$;
