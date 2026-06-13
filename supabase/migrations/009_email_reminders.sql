-- =========================================================
-- 009 — Rappel email avant auto-validation
-- Trace l'envoi du rappel « validation automatique dans ~48h »
-- à l'entreprise, pour ne l'envoyer qu'une seule fois par RDV
-- (le cron auto-validate filtre sur reminder_sent_at is null).
-- =========================================================

alter table meetings
  add column if not exists reminder_sent_at timestamptz;
