-- ============================================================
-- TAÏGA — Politiques Storage (rejeu robuste)
-- À exécuter APRÈS 014, dans le SQL Editor.
--
-- Constat : les buckets ET les politiques de la migration 003 ne s'étaient pas
-- appliqués (l'insert dans storage.buckets via le SQL Editor échoue souvent et
-- interrompt le script). Les buckets ont été recréés via l'API Storage ; ce
-- fichier (re)crée UNIQUEMENT les fonctions helper + les politiques sur
-- storage.objects, de façon idempotente.
-- ============================================================

-- ---------- Helpers (accès mission) ----------
create or replace function public.can_access_mission(mid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from missions m where m.id = mid and (
      m.carrier_company_id = my_company()
      or my_role() = 'admin'
      or exists (
        select 1 from mission_shipments ms
        join shipments s on s.id = ms.shipment_id
        where ms.mission_id = m.id and s.shipper_company_id = my_company()
      )
    )
  );
$$;

create or replace function public.is_mission_carrier(mid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from missions m where m.id = mid and m.carrier_company_id = my_company()
  );
$$;

-- ---------- carrier-docs : {company_id}/... ----------
drop policy if exists "carrier-docs read own or admin" on storage.objects;
create policy "carrier-docs read own or admin" on storage.objects for select using (
  bucket_id = 'carrier-docs'
  and ((storage.foldername(name))[1] = my_company()::text or my_role() = 'admin')
);
drop policy if exists "carrier-docs insert own" on storage.objects;
create policy "carrier-docs insert own" on storage.objects for insert with check (
  bucket_id = 'carrier-docs' and (storage.foldername(name))[1] = my_company()::text
);
drop policy if exists "carrier-docs update own" on storage.objects;
create policy "carrier-docs update own" on storage.objects for update using (
  bucket_id = 'carrier-docs' and (storage.foldername(name))[1] = my_company()::text
);
drop policy if exists "carrier-docs delete own or admin" on storage.objects;
create policy "carrier-docs delete own or admin" on storage.objects for delete using (
  bucket_id = 'carrier-docs'
  and ((storage.foldername(name))[1] = my_company()::text or my_role() = 'admin')
);

-- ---------- pods : {mission_id}/... ----------
drop policy if exists "pods read via mission" on storage.objects;
create policy "pods read via mission" on storage.objects for select using (
  bucket_id = 'pods' and public.can_access_mission(((storage.foldername(name))[1])::uuid)
);
drop policy if exists "pods insert by carrier" on storage.objects;
create policy "pods insert by carrier" on storage.objects for insert with check (
  bucket_id = 'pods' and public.is_mission_carrier(((storage.foldername(name))[1])::uuid)
);
drop policy if exists "pods update by carrier" on storage.objects;
create policy "pods update by carrier" on storage.objects for update using (
  bucket_id = 'pods' and public.is_mission_carrier(((storage.foldername(name))[1])::uuid)
);

-- ---------- signatures : {mission_id}/... ----------
drop policy if exists "signatures read via mission" on storage.objects;
create policy "signatures read via mission" on storage.objects for select using (
  bucket_id = 'signatures' and public.can_access_mission(((storage.foldername(name))[1])::uuid)
);
drop policy if exists "signatures insert by carrier" on storage.objects;
create policy "signatures insert by carrier" on storage.objects for insert with check (
  bucket_id = 'signatures' and public.is_mission_carrier(((storage.foldername(name))[1])::uuid)
);

-- ---------- invoices : {shipment_id}/... ----------
drop policy if exists "invoices read shipper or admin" on storage.objects;
create policy "invoices read shipper or admin" on storage.objects for select using (
  bucket_id = 'invoices'
  and exists (
    select 1 from shipments s
    where s.id = ((storage.foldername(name))[1])::uuid
      and (s.shipper_company_id = my_company() or my_role() = 'admin')
  )
);
drop policy if exists "invoices write admin" on storage.objects;
create policy "invoices write admin" on storage.objects for insert with check (
  bucket_id = 'invoices' and my_role() = 'admin'
);

-- Fin migration 015
