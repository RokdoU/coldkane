-- =========================================================
-- 010 — Identifiant unique par badge décerné.
-- Les cartes OG événementielles (/api/og/event/[eventId]) référencent
-- un événement réel en base : l'URL fonctionne = l'événement existe,
-- une carte forgée pointe sur un 404. Les payouts utilisent l'id du
-- meeting ; les badges ont besoin de leur propre id (PK composite).
-- =========================================================

alter table caller_badges
  add column if not exists id uuid not null default uuid_generate_v4();

create unique index if not exists caller_badges_event_id on caller_badges (id);
