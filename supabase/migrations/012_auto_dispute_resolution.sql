-- =========================================================
-- 012 — Résolution de litige automatique (plateforme autonome).
--
-- Tant que l'arbitrage est manuel, le volume de litiges plafonne la
-- croissance. Ici, un litige non tranché par nous se résout seul au bout du
-- SLA selon une règle par défaut. L'arbitrage manuel (route interne) reste
-- prioritaire : s'il tranche avant le SLA, le status change et le cron ne voit
-- plus le litige.
--
-- RÈGLE D'ÉQUIPE (cf. 011) : fonctions security definer créées ici avec
-- revoke execute from public, anon, authenticated + grant au rôle strict.
--
-- Invariant préservé : un meeting 'disputed' réserve sa place budget
-- (declare_meeting compte booked + validated + disputed). Aucune transition
-- ci-dessous ne dépasse meetings_target.
-- =========================================================

-- Traçabilité du litige : ouverture, preuve éventuelle du caller, marque auto.
alter table meetings
  add column if not exists disputed_at timestamptz,
  add column if not exists caller_evidence text,
  add column if not exists auto_resolution boolean not null default false,
  add column if not exists dispute_reminder_sent_at timestamptz;

comment on column meetings.disputed_at is 'Ouverture du litige : départ du SLA de résolution auto';
comment on column meetings.caller_evidence is 'Preuve fournie par le caller (texte/lien) — décide la résolution par défaut';
comment on column meetings.auto_resolution is 'Le litige a été tranché automatiquement (pas par un humain)';
comment on column meetings.dispute_reminder_sent_at is 'Rappel « résolution auto imminente » envoyé (dédup)';

-- =========================================================
-- dispute_meeting : recréée pour horodater l'ouverture du litige (disputed_at).
-- Le reste est identique à la 003.
-- =========================================================
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
  set status = 'disputed', dispute_reason = p_reason, disputed_at = now()
  where id = p_meeting_id;
end;
$$;

revoke execute on function dispute_meeting(uuid, uuid, text) from public, anon, authenticated;
grant execute on function dispute_meeting(uuid, uuid, text) to service_role;

-- =========================================================
-- submit_dispute_evidence : le caller fournit sa preuve sur SON RDV contesté.
-- meetings.UPDATE est révoqué côté client (006) → passage par cette RPC.
-- =========================================================
create or replace function submit_dispute_evidence(
  p_meeting_id uuid,
  p_evidence text
) returns void
language plpgsql
security definer
as $$
declare
  v_meeting meetings;
begin
  select * into v_meeting from meetings where id = p_meeting_id for update;
  if not found or v_meeting.caller_id <> auth.uid() then
    raise exception 'RDV introuvable ou non autorisé';
  end if;
  if v_meeting.status <> 'disputed' then
    raise exception 'Ce RDV n''est pas en litige';
  end if;
  if coalesce(trim(p_evidence), '') = '' then
    raise exception 'La preuve ne peut pas être vide';
  end if;

  update meetings set caller_evidence = p_evidence where id = p_meeting_id;
end;
$$;

revoke execute on function submit_dispute_evidence(uuid, text) from public, anon;
grant execute on function submit_dispute_evidence(uuid, text) to authenticated;

-- =========================================================
-- auto_resolve_due_disputes : appelée par le cron horaire.
-- Pour chaque litige dont le SLA est dépassé, applique la règle par défaut.
-- Renvoie (meeting_id, outcome) pour que l'app déclenche payouts + emails.
--   outcome 'validated' → faveur caller (preuve fournie) : score + ledger via
--                         validate_meeting ; le payout Stripe suit côté app.
--   outcome 'cancelled' → faveur entreprise (aucune preuve) : place budget rendue.
-- =========================================================
create or replace function auto_resolve_due_disputes(
  p_sla_hours integer default 72,
  p_commission_rate numeric default 0.15
) returns table (meeting_id uuid, outcome text)
language plpgsql
security definer
as $$
declare
  v_meeting meetings;
begin
  for v_meeting in
    select * from meetings
    where status = 'disputed'
      and disputed_at is not null
      and disputed_at + make_interval(hours => p_sla_hours) <= now()
    order by disputed_at
    limit 100
  loop
    if v_meeting.caller_evidence is null then
      -- Aucune preuve : annulation (faveur entreprise), place budget rendue.
      update meetings
      set status = 'cancelled', auto_resolution = true, resolved_at = now()
      where id = v_meeting.id;
      meeting_id := v_meeting.id;
      outcome := 'cancelled';
      return next;
    else
      -- Preuve fournie, entreprise non escaladée : validation (faveur caller).
      -- On repasse 'booked' pour satisfaire la précondition de validate_meeting,
      -- qui applique ensuite score + ledger atomiquement.
      update meetings set status = 'booked' where id = v_meeting.id;
      perform validate_meeting(v_meeting.id, null, p_commission_rate);
      update meetings
      set auto_resolution = true, resolved_at = now()
      where id = v_meeting.id;
      meeting_id := v_meeting.id;
      outcome := 'validated';
      return next;
    end if;
  end loop;
end;
$$;

revoke execute on function auto_resolve_due_disputes(integer, numeric) from public, anon, authenticated;
grant execute on function auto_resolve_due_disputes(integer, numeric) to service_role;
