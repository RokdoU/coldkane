-- =========================================================
-- Features virales : kill feed public + parrainage
-- =========================================================

-- Kill feed : les dernières validations, exposées publiquement.
-- Vue en droits propriétaire (bypass RLS volontaire) — ne expose QUE des
-- colonnes sûres : pseudo, entreprise, montant, date. Jamais le prospect.
create or replace view recent_validations as
select
  m.id,
  p.username   as caller_username,
  co.name      as company_name,
  m.payout_cents,
  m.validated_at
from meetings m
join profiles p  on p.id = m.caller_id
join missions mi on mi.id = m.mission_id
join companies co on co.profile_id = mi.company_id
where m.status = 'validated' and m.validated_at is not null
order by m.validated_at desc
limit 25;

grant select on recent_validations to anon, authenticated;

-- Parrainage : qui a recruté ce profil (résolu au signup via le username du parrain)
alter table profiles
  add column if not exists referred_by uuid references profiles (id);

comment on column profiles.referred_by is
  'Parrain (REFERRAL dans lib/config.ts : 5% des gains du filleul pendant 3 mois)';

-- Le trigger de création de profil résout le pseudo du parrain s'il est fourni
create or replace function handle_new_user() returns trigger
language plpgsql
security definer
as $$
declare
  v_role user_role := coalesce(new.raw_user_meta_data ->> 'role', 'caller')::user_role;
  v_referrer uuid;
begin
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
    v_referrer
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
