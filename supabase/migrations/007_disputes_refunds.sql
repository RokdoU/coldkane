-- =========================================================
-- 007 — Résolution des litiges + clôture de mission
-- Saison 0 : l'équipe arbitre les RDV contestés. Ces RPC ne sont
-- appelables que par le service role (route API interne protégée).
-- =========================================================

-- Trace d'arbitrage : qui a tranché un litige, et quand.
alter table meetings
  add column if not exists resolved_by uuid references profiles (id),
  add column if not exists resolved_at timestamptz;

comment on column meetings.resolved_by is 'Admin ayant arbitré le litige (null si arbitrage outillé)';
comment on column meetings.resolved_at is 'Date de l''arbitrage du litige';

-- =========================================================
-- resolve_dispute : litige tranché en faveur de l'entreprise.
-- Le RDV contesté passe 'cancelled' : pas de payout, pas de points.
-- L'index unique meetings_dedup exclut status='cancelled', donc le hash
-- prospect redevient déclarable sur la mission — comportement voulu
-- (un vrai RDV avec ce prospect pourra être redéclaré plus tard).
-- =========================================================
create or replace function resolve_dispute(
  p_meeting_id uuid,
  p_outcome text,
  p_admin uuid default null
) returns meetings
language plpgsql
security definer
as $$
declare
  v_meeting meetings;
begin
  select * into v_meeting from meetings where id = p_meeting_id for update;
  if not found then
    raise exception 'meeting % introuvable', p_meeting_id;
  end if;
  if v_meeting.status <> 'disputed' then
    raise exception 'meeting % non litigieux (status %)', p_meeting_id, v_meeting.status;
  end if;

  if p_outcome = 'cancelled' then
    update meetings
    set status = 'cancelled',
        resolved_by = p_admin,
        resolved_at = now()
    where id = p_meeting_id
    returning * into v_meeting;
  elsif p_outcome = 'validated' then
    -- Le litige en faveur du caller passe par undispute_meeting (ci-dessous)
    -- puis validateMeetingAndPay côté app : le payout Stripe reste centralisé.
    raise exception 'outcome validated : passer par undispute_meeting puis validateMeetingAndPay';
  else
    raise exception 'outcome % inconnu (attendu : validated | cancelled)', p_outcome;
  end if;

  return v_meeting;
end;
$$;

-- =========================================================
-- undispute_meeting : litige tranché en faveur du caller.
-- Le RDV repasse 'booked' ; la validation effective (score + ledger via
-- validate_meeting) et le payout Stripe sont déclenchés juste après côté
-- app par validateMeetingAndPay. Filet de sécurité : si l'app échoue entre
-- les deux, le cron auto-validate rattrape ce RDV redevenu 'booked' dès que
-- auto_validate_at est dépassé (et le cron retry-payouts couvre le transfer).
-- =========================================================
create or replace function undispute_meeting(p_meeting_id uuid) returns meetings
language plpgsql
security definer
as $$
declare
  v_meeting meetings;
begin
  select * into v_meeting from meetings where id = p_meeting_id for update;
  if not found then
    raise exception 'meeting % introuvable', p_meeting_id;
  end if;
  if v_meeting.status <> 'disputed' then
    raise exception 'meeting % non litigieux (status %)', p_meeting_id, v_meeting.status;
  end if;

  update meetings
  set status = 'booked',
      resolved_at = now()
  where id = p_meeting_id
  returning * into v_meeting;

  return v_meeting;
end;
$$;

-- Service role uniquement : c'est l'équipe qui arbitre en saison 0.
-- (revoke from public obligatoire : Postgres accorde EXECUTE à public
-- par défaut, anon et authenticated en hériteraient silencieusement)
revoke execute on function resolve_dispute(uuid, text, uuid) from public, anon, authenticated;
revoke execute on function undispute_meeting(uuid) from public, anon, authenticated;
grant execute on function resolve_dispute(uuid, text, uuid) to service_role;
grant execute on function undispute_meeting(uuid) to service_role;
