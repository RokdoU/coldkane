-- V1 : création de profil à l'inscription, cycle de vie complet des RDV
-- (validation entreprise, auto-validation après délai, litiges), fin de saison,
-- catalogue de badges.

-- =========================================================
-- Création automatique du profil à l'inscription
-- (metadata passées par supabase.auth.signUp côté app)
-- =========================================================

create or replace function handle_new_user() returns trigger
language plpgsql
security definer
as $$
declare
  v_role user_role := coalesce(new.raw_user_meta_data ->> 'role', 'caller')::user_role;
begin
  insert into profiles (id, role, username, full_name)
  values (
    new.id,
    v_role,
    new.raw_user_meta_data ->> 'username',
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Anonyme')
  );

  if v_role = 'caller' then
    insert into callers (profile_id) values (new.id);
  else
    insert into companies (profile_id, name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'company_name', 'Entreprise'));
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =========================================================
-- Cycle de vie des RDV
-- =========================================================

-- Fenêtre de validation : passé ce délai après l'heure du RDV, validation auto
alter table meetings
  add column if not exists auto_validate_at timestamptz,
  add column if not exists dispute_reason text;

-- À la déclaration d'un RDV, la deadline d'auto-validation est posée :
-- 72h après l'heure prévue du RDV.
create or replace function set_auto_validate_at() returns trigger
language plpgsql
as $$
begin
  new.auto_validate_at := new.scheduled_at + interval '72 hours';
  return new;
end;
$$;

drop trigger if exists meetings_auto_validate_at on meetings;
create trigger meetings_auto_validate_at
  before insert on meetings
  for each row execute function set_auto_validate_at();

-- L'entreprise conteste un RDV (avant l'auto-validation)
create or replace function dispute_meeting(
  p_meeting_id uuid,
  p_company_id uuid,
  p_reason text
) returns void
language plpgsql
security definer
as $$
declare
  v_meeting meetings;
begin
  select m.* into v_meeting
  from meetings m
  join missions mi on mi.id = m.mission_id
  where m.id = p_meeting_id and mi.company_id = p_company_id
  for update of m;

  if not found then
    raise exception 'RDV introuvable ou non autorisé';
  end if;
  if v_meeting.status <> 'booked' then
    raise exception 'RDV non contestable (status %)', v_meeting.status;
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'Une raison est obligatoire pour contester';
  end if;

  update meetings
  set status = 'disputed', dispute_reason = p_reason
  where id = p_meeting_id;
end;
$$;

-- Les RDV passés non contestés sont validés automatiquement (appelé par cron).
-- Retourne les ids validés pour que l'app déclenche les payouts Stripe.
create or replace function auto_validate_due_meetings(
  p_commission_rate numeric default 0.15
) returns setof uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  for v_id in
    select id from meetings
    where status = 'booked' and auto_validate_at <= now()
    order by auto_validate_at
    limit 100
  loop
    perform validate_meeting(v_id, null, p_commission_rate);
    return next v_id;
  end loop;
end;
$$;

-- =========================================================
-- Fin de saison : badges du podium, reset partiel, saison suivante
-- =========================================================

create or replace function close_season(p_carryover numeric default 0.2)
returns uuid
language plpgsql
security definer
as $$
declare
  v_season seasons;
  v_next_id uuid;
  v_next_number integer;
  v_row record;
begin
  select * into v_season from seasons where is_active limit 1 for update;
  if not found then
    raise exception 'aucune saison active';
  end if;
  if v_season.ends_at > now() then
    raise exception 'la saison % ne se termine que le %', v_season.number, v_season.ends_at;
  end if;

  -- badges du podium (catalogue seedé plus bas)
  for v_row in
    select caller_id, row_number() over (order by points desc) as rk
    from season_scores
    where season_id = v_season.id
    order by points desc
    limit 10
  loop
    insert into caller_badges (caller_id, badge_id, season_id)
    select v_row.caller_id, b.id, v_season.id
    from badges b
    where b.slug = case
      when v_row.rk = 1 then 'season-champion'
      when v_row.rk <= 3 then 'season-podium'
      else 'season-legende'
    end
    on conflict do nothing;
  end loop;

  update seasons set is_active = false where id = v_season.id;

  v_next_number := v_season.number + 1;
  insert into seasons (number, name, starts_at, ends_at, is_active)
  values (
    v_next_number,
    'Saison ' || v_next_number,
    now(),
    now() + interval '6 weeks',
    true
  )
  returning id into v_next_id;

  -- reset partiel : on repart avec une fraction de ses points (placement)
  insert into season_scores (season_id, caller_id, points)
  select v_next_id, caller_id, floor(points * p_carryover)::integer
  from season_scores
  where season_id = v_season.id and points > 0;

  return v_next_id;
end;
$$;

-- =========================================================
-- Catalogue de badges
-- =========================================================

insert into badges (slug, label, description, icon) values
  ('first-blood', 'First Blood', 'Premier RDV validé de la saison', 'flame'),
  ('streak-5', 'Série de 5', '5 RDV validés d''affilée', 'flame'),
  ('streak-10', 'Série de 10', '10 RDV validés d''affilée', 'zap'),
  ('zero-noshow', 'Zéro no-show', 'Aucun no-show sur une saison complète', 'shield'),
  ('top-week', 'Top semaine', 'Meilleur score hebdomadaire', 'crown'),
  ('rookie-spotlight', 'Rookie Spotlight', 'Meilleur débutant du mois', 'sparkle'),
  ('season-champion', 'Champion de saison', 'Numéro 1 d''une saison', 'trophy'),
  ('season-podium', 'Podium de saison', 'Top 3 d''une saison', 'medal'),
  ('season-legende', 'Légende de saison', 'Top 10 d''une saison', 'star')
on conflict (slug) do nothing;

-- Badges de streak attribués au fil de l'eau (après chaque validation)
create or replace function award_streak_badges() returns trigger
language plpgsql
security definer
as $$
begin
  if new.current_streak >= 5 and new.current_streak > old.current_streak then
    insert into caller_badges (caller_id, badge_id, season_id)
    select new.caller_id, b.id, new.season_id from badges b where b.slug = 'streak-5'
    on conflict do nothing;
  end if;
  if new.current_streak >= 10 and new.current_streak > old.current_streak then
    insert into caller_badges (caller_id, badge_id, season_id)
    select new.caller_id, b.id, new.season_id from badges b where b.slug = 'streak-10'
    on conflict do nothing;
  end if;
  if new.meetings_validated = 1 and old.meetings_validated = 0 then
    insert into caller_badges (caller_id, badge_id, season_id)
    select new.caller_id, b.id, new.season_id from badges b where b.slug = 'first-blood'
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists season_scores_badges on season_scores;
create trigger season_scores_badges
  after update on season_scores
  for each row execute function award_streak_badges();

-- =========================================================
-- RLS complémentaires
-- =========================================================

-- L'entreprise peut accepter/refuser une candidature sur SA mission
create policy "company manages applications" on assignments for update
  using (auth.uid() = (select company_id from missions where id = mission_id));

-- Saison 1 si aucune saison n'existe encore
insert into seasons (number, name, starts_at, ends_at, is_active)
select 1, 'Saison 1 — Premier Sang', now(), now() + interval '6 weeks', true
where not exists (select 1 from seasons);
