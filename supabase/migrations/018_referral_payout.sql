-- =========================================================
-- 018 — Versement automatique du rev-share parrain.
-- Quand un filleul encaisse un RDV validé, son parrain touche REFERRAL.rate
-- de ce payout (pendant la fenêtre REFERRAL.months). Le transfer Stripe est
-- tracé ici par RDV pour garantir l'idempotence (un seul rev-share par RDV).
-- Versement effectif par le cron idempotent (lib/cron-jobs.ts).
-- =========================================================

alter table meetings
  add column if not exists referral_transfer_id text;

comment on column meetings.referral_transfer_id is
  'Transfer Stripe du rev-share parrain pour ce RDV (idempotence du versement)';
