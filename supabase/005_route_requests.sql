-- ============================================================
-- TAÏGA — Phase 2 : Demandes de trajet hors-corridor
-- À exécuter APRÈS 004_auth_onboarding.sql, dans le SQL Editor.
--
-- Quand un expéditeur a besoin d'un trajet non couvert par un corridor
-- existant, il envoie une demande manuelle. On la capte en base (pour savoir
-- quelles lignes ouvrir) et on notifie l'admin en interne.
-- (L'envoi par courriel viendra avec Resend — voir checklist « avant prod ».)
-- ============================================================

create table route_requests (
  id uuid primary key default uuid_generate_v4(),
  requested_by  uuid not null references profiles(id),
  company_id    uuid references companies(id),
  origin_city   text not null,
  origin_address text,
  dest_city     text not null,
  dest_address  text,
  requested_date date,
  notes         text,
  status        text not null default 'nouveau' check (status in ('nouveau','en_analyse','traite')),
  created_at    timestamptz default now()
);

alter table route_requests enable row level security;

-- L'expéditeur voit/crée les siennes ; l'admin voit tout et met à jour le statut.
create policy "route req: owner or admin (select)" on route_requests for select using (
  requested_by = auth.uid() or my_role() = 'admin'
);
create policy "route req: owner insert" on route_requests for insert with check (
  requested_by = auth.uid()
);
create policy "route req: admin update" on route_requests for update using (
  my_role() = 'admin'
);

-- RPC : crée la demande ET notifie tous les admins (security definer pour pouvoir
-- lire la liste des admins malgré la RLS de profiles).
create or replace function public.request_custom_route(
  p_origin_city    text,
  p_dest_city      text,
  p_origin_address text default null,
  p_dest_address   text default null,
  p_requested_date date default null,
  p_notes          text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_company uuid;
  v_req     uuid;
  v_admin   record;
begin
  if v_uid is null then
    raise exception 'Non authentifié';
  end if;
  if coalesce(btrim(p_origin_city), '') = '' or coalesce(btrim(p_dest_city), '') = '' then
    raise exception 'Villes d''origine et de destination obligatoires';
  end if;

  select company_id into v_company from profiles where id = v_uid;

  insert into route_requests (
    requested_by, company_id, origin_city, origin_address,
    dest_city, dest_address, requested_date, notes
  ) values (
    v_uid, v_company, btrim(p_origin_city), nullif(btrim(p_origin_address), ''),
    btrim(p_dest_city), nullif(btrim(p_dest_address), ''), p_requested_date, nullif(btrim(p_notes), '')
  )
  returning id into v_req;

  for v_admin in select id from profiles where role = 'admin' loop
    insert into notifications (profile_id, channel, title, body, link)
    values (
      v_admin.id, 'interne',
      'Nouvelle demande de trajet hors-corridor',
      format('%s → %s', btrim(p_origin_city), btrim(p_dest_city)),
      '/admin/demandes-trajet'
    );
  end loop;

  return v_req;
end;
$$;

revoke all on function public.request_custom_route(text, text, text, text, date, text) from public;
grant execute on function public.request_custom_route(text, text, text, text, date, text) to authenticated;

-- Fin Phase 2 (migration 005)
