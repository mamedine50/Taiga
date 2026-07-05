-- ============================================================
-- TAÏGA — Étape 4 (Phase 1) : Onboarding sécurisé
-- À exécuter APRÈS 003_storage.sql, dans le SQL Editor.
--
-- Problème résolu : la RLS n'autorise pas un utilisateur normal à créer une
-- ligne `companies` (réservé à l'admin). Pour l'inscription en libre-service,
-- cette fonction `security definer` crée l'entreprise ET relie le profil,
-- sans exposer de clé de service côté client.
-- ============================================================

create or replace function public.create_company_and_link(
  p_legal_name text,
  p_neq        text default null,
  p_city       text default null,
  p_phone      text default null,
  p_language   text default 'fr'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_role      user_role;
  v_existing  uuid;
  v_type      company_type;
  v_company   uuid;
  v_lang      text := case when p_language = 'en' then 'en' else 'fr' end;
begin
  if v_uid is null then
    raise exception 'Non authentifié';
  end if;

  if coalesce(btrim(p_legal_name), '') = '' then
    raise exception 'La raison sociale est obligatoire';
  end if;

  select role, company_id into v_role, v_existing
  from profiles where id = v_uid;

  if v_existing is not null then
    raise exception 'Ce profil est déjà rattaché à une entreprise';
  end if;

  -- Seuls expéditeur et transporteur peuvent créer une entreprise en libre-service.
  if v_role not in ('shipper', 'carrier') then
    raise exception 'Rôle non autorisé à créer une entreprise : %', v_role;
  end if;

  v_type := v_role::text::company_type;  -- shipper/carrier ↔ 1:1

  insert into companies (type, legal_name, neq, city, phone, language)
  values (v_type, btrim(p_legal_name), nullif(btrim(p_neq), ''), nullif(btrim(p_city), ''),
          nullif(btrim(p_phone), ''), v_lang)
  returning id into v_company;

  update profiles
    set company_id = v_company,
        language   = v_lang
  where id = v_uid;

  return v_company;
end;
$$;

-- Accessible aux utilisateurs authentifiés (la fonction impose ses propres garde-fous).
revoke all on function public.create_company_and_link(text, text, text, text, text) from public;
grant execute on function public.create_company_and_link(text, text, text, text, text) to authenticated;

-- Fin étape 4 (Phase 1)
