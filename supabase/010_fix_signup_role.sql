-- ============================================================
-- TAÏGA — Correctif SÉCURITÉ : rôle à l'inscription
-- À exécuter APRÈS 009, dans le SQL Editor.
--
-- Faille : handle_new_user() faisait confiance au `role` envoyé dans les
-- métadonnées client → un utilisateur pouvait s'inscrire en `admin` ou `driver`.
-- Correctif : l'auto-inscription ne permet QUE `shipper` ou `carrier`.
-- (admin = promu par un autre admin ; driver = créé par son transporteur.)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
begin
  v_role := case
    when new.raw_user_meta_data->>'role' in ('shipper', 'carrier')
      then (new.raw_user_meta_data->>'role')::user_role
    else 'shipper'::user_role
  end;

  insert into public.profiles (id, full_name, role, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_role,
    coalesce(new.raw_user_meta_data->>'language', 'fr')
  );
  return new;
end;
$$;

-- Fin correctif 010
