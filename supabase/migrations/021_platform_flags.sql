-- =========================================================
-- 021 — Kill switch : freiner l'afflux sans redéployer.
-- Table singleton lue au runtime. En cas de pic viral qui casse, l'équipe
-- bascule un flag depuis Supabase (UPDATE) → effet en < 30s (cache), sans
-- redéploiement Vercel.
-- =========================================================
create table platform_flags (
  id boolean primary key default true check (id), -- singleton (une seule ligne)
  signups_paused boolean not null default false,
  new_missions_paused boolean not null default false,
  notice text,                                     -- message public optionnel
  updated_at timestamptz not null default now()
);

insert into platform_flags (id) values (true) on conflict do nothing;

-- Les flags ne sont pas secrets : lecture publique. Écriture = service role
-- uniquement (aucune policy d'écriture → seul le service role / l'éditeur SQL).
alter table platform_flags enable row level security;
create policy "public read flags" on platform_flags for select using (true);
