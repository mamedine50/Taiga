-- ============================================================
-- TAÏGA — Étape 3 : Stockage (buckets + politiques d'accès)
-- À exécuter APRÈS 002_functions_triggers.sql, dans le SQL Editor.
--
-- Buckets (tous PRIVÉS — accès uniquement via URLs signées ou RLS) :
--   • carrier-docs  → documents transporteurs (assurances, PEVL, permis…)
--                     Convention de chemin : {company_id}/{fichier}
--   • pods          → photos de preuve de livraison
--                     Convention de chemin : {mission_id}/{fichier}
--   • signatures    → signatures de réception
--                     Convention de chemin : {mission_id}/{fichier}
--   • invoices      → factures PDF (lecture expéditeur concerné + admin)
--                     Convention de chemin : {shipment_id}/{fichier}
--
-- Les politiques réutilisent les helpers my_company() / my_role() de l'étape 1.
-- storage.foldername(name) découpe le chemin ; [1] = premier dossier.
-- ============================================================

-- ---------- CRÉATION DES BUCKETS (privés) ----------
insert into storage.buckets (id, name, public) values
  ('carrier-docs', 'carrier-docs', false),
  ('pods',         'pods',         false),
  ('signatures',   'signatures',   false),
  ('invoices',     'invoices',     false)
on conflict (id) do nothing;

-- ============================================================
-- carrier-docs : le transporteur gère les docs de SA compagnie ; l'admin voit tout
-- ============================================================
create policy "carrier-docs read own or admin" on storage.objects for select using (
  bucket_id = 'carrier-docs'
  and ( (storage.foldername(name))[1] = my_company()::text or my_role() = 'admin' )
);
create policy "carrier-docs insert own" on storage.objects for insert with check (
  bucket_id = 'carrier-docs'
  and (storage.foldername(name))[1] = my_company()::text
);
create policy "carrier-docs update own" on storage.objects for update using (
  bucket_id = 'carrier-docs'
  and (storage.foldername(name))[1] = my_company()::text
);
create policy "carrier-docs delete own or admin" on storage.objects for delete using (
  bucket_id = 'carrier-docs'
  and ( (storage.foldername(name))[1] = my_company()::text or my_role() = 'admin' )
);

-- ============================================================
-- pods & signatures : téléversés par le transporteur de la mission ;
--   lisibles par le transporteur, l'expéditeur concerné et l'admin.
--   ({mission_id} = premier dossier du chemin)
-- ============================================================

-- Helper : l'utilisateur courant a-t-il accès à cette mission ?
create or replace function public.can_access_mission(mid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
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

-- Helper : l'utilisateur courant est-il le transporteur de cette mission ? (écriture)
create or replace function public.is_mission_carrier(mid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from missions m
    where m.id = mid and m.carrier_company_id = my_company()
  );
$$;

-- POD
create policy "pods read via mission" on storage.objects for select using (
  bucket_id = 'pods' and public.can_access_mission( ((storage.foldername(name))[1])::uuid )
);
create policy "pods insert by carrier" on storage.objects for insert with check (
  bucket_id = 'pods' and public.is_mission_carrier( ((storage.foldername(name))[1])::uuid )
);
create policy "pods update by carrier" on storage.objects for update using (
  bucket_id = 'pods' and public.is_mission_carrier( ((storage.foldername(name))[1])::uuid )
);

-- Signatures
create policy "signatures read via mission" on storage.objects for select using (
  bucket_id = 'signatures' and public.can_access_mission( ((storage.foldername(name))[1])::uuid )
);
create policy "signatures insert by carrier" on storage.objects for insert with check (
  bucket_id = 'signatures' and public.is_mission_carrier( ((storage.foldername(name))[1])::uuid )
);

-- ============================================================
-- invoices : lecture par l'expéditeur concerné + admin ; écriture réservée à l'admin
--   ({shipment_id} = premier dossier du chemin)
-- ============================================================
create policy "invoices read shipper or admin" on storage.objects for select using (
  bucket_id = 'invoices'
  and exists (
    select 1 from shipments s
    where s.id = ((storage.foldername(name))[1])::uuid
      and ( s.shipper_company_id = my_company() or my_role() = 'admin' )
  )
);
create policy "invoices write admin" on storage.objects for insert with check (
  bucket_id = 'invoices' and my_role() = 'admin'
);

-- Fin étape 3
