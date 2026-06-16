-- =========================================================
-- 015 — Apport d'affaires (autonomie côté demande).
-- Un caller qui ramène une entreprise déposant de l'escrow est rémunéré comme
-- apporteur. Le même lien d'affiliation `?ref=<pseudo>` sert aux deux faces :
--   - filleul caller   → profiles.referred_by (parrainage, rev-share)
--   - entreprise amenée → companies.brought_by (apport, prime à l'activation)
-- Le versement de la prime est géré par un cron idempotent (lib/cron-jobs.ts),
-- pas ici : robuste si le compte Connect de l'apporteur n'est pas encore prêt.
-- =========================================================

alter table companies
  add column if not exists brought_by uuid references profiles (id),
  add column if not exists apporteur_rewarded_at timestamptz;

comment on column companies.brought_by is 'Apporteur (caller) qui a ramené cette entreprise via son lien ?ref';
comment on column companies.apporteur_rewarded_at is 'Prime d''activation versée à l''apporteur (idempotence)';

-- =========================================================
-- handle_new_user : recréée pour résoudre l'apporteur d'une entreprise.
-- Identique à 005 pour les callers (referred_by), + companies.brought_by.
-- =========================================================
create or replace function handle_new_user() returns trigger
language plpgsql
security definer
as $$
declare
  v_role user_role := coalesce(new.raw_user_meta_data ->> 'role', 'caller')::user_role;
  v_referrer uuid;
begin
  -- Le parrain/apporteur est un caller existant, résolu par son pseudo
  select id into v_referrer
  from profiles
  where username = new.raw_user_meta_data ->> 'referred_by_username'
    and role = 'caller';

  insert into profiles (id, role, username, full_name, referred_by)
  values (
    new.id,
    v_role,
    new.raw_user_meta_data ->> 'username',
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Anonyme'),
    case when v_role = 'caller' then v_referrer else null end
  );

  if v_role = 'caller' then
    insert into callers (profile_id) values (new.id);
  else
    insert into companies (profile_id, name, brought_by)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'company_name', 'Entreprise'),
      v_referrer
    );
  end if;

  return new;
end;
$$;

-- =========================================================
-- Badge « Génération Fondatrice » : émis uniquement saison 0-1, jamais réédité
-- (rareté temporelle). Décerné à l'apporteur par le cron au 1er apport.
-- =========================================================
insert into badges (slug, label, description, icon) values
  ('founding-generation', 'Génération Fondatrice', 'A ramené une entreprise pendant les saisons fondatrices', 'crown')
on conflict (slug) do nothing;
