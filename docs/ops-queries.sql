-- =========================================================
-- ColdKane — requêtes de monitoring (lancement public).
-- À coller dans l'éditeur SQL Supabase pour voir l'état de la machine
-- en un coup d'œil. Aucune écriture — lecture seule.
-- =========================================================

-- 1) Payouts en attente : RDV validés non encore versés, avec l'âge.
--    Un âge > 48h = anomalie (le cron daily aurait dû rattraper).
select
  m.id,
  m.validated_at,
  round(extract(epoch from (now() - m.validated_at)) / 3600) as age_heures,
  m.payout_cents,
  c.payouts_enabled,
  (c.stripe_account_id is not null) as a_un_compte_connect
from meetings m
join callers c on c.profile_id = m.caller_id
where m.status = 'validated' and m.stripe_transfer_id is null
order by m.validated_at;

-- 2) Litiges ouverts (disputed) avec l'échéance de résolution auto.
select
  m.id,
  m.disputed_at,
  m.dispute_reason,
  (m.caller_evidence is not null) as preuve_fournie,
  m.disputed_at + interval '72 hours' as resolution_auto_le
from meetings m
where m.status = 'disputed'
order by m.disputed_at;

-- 3) Flags fraude non traités.
select id, kind, subject_profile_id, subject_meeting_id, details, created_at
from fraud_flags
order by created_at desc
limit 100;

-- 4) Apporteurs en attente de prime (entreprise ramenée, pas encore récompensée).
select co.profile_id as company_id, co.name, co.brought_by as apporteur, co.created_at
from companies co
where co.brought_by is not null and co.apporteur_rewarded_at is null;

-- 5) Liquidité : missions financées encore ouvertes (du stock pour les callers ?).
select
  count(*) as missions_ouvertes,
  coalesce(sum(m.budget_cents), 0) as budget_total_cents
from missions m
where m.status in ('funded', 'active');

-- 6) Compteur de preuve sociale (doit être > 0 le jour de l'allumage).
select * from platform_stats;

-- 7) Kill switch : état actuel des flags.
select * from platform_flags;

-- =========================================================
-- Bascules manuelles (à exécuter au besoin, service role / éditeur SQL)
-- =========================================================
-- Mettre les inscriptions en pause :
--   update platform_flags set signups_paused = true,
--     notice = 'On régule l''afflux, réouverture imminente.' where id;
-- Mettre le dépôt de nouvelles missions en pause :
--   update platform_flags set new_missions_paused = true where id;
-- Tout rouvrir :
--   update platform_flags set signups_paused = false,
--     new_missions_paused = false, notice = null where id;
