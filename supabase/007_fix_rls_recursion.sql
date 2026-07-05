-- ============================================================
-- TAÏGA — Correctif : récursion infinie entre les politiques RLS
-- À exécuter APRÈS 006_reference_data_read.sql, dans le SQL Editor.
--
-- Constat : « infinite recursion detected in policy for relation shipments ».
-- La politique SELECT de `shipments` interroge `missions`, et celle de
-- `missions` interroge `shipments` → boucle infinie dès qu'un utilisateur
-- authentifié lit/insère une expédition.
--
-- Solution : déplacer les vérifications croisées dans des fonctions
-- `security definer` qui contournent la RLS interne, cassant la récursion.
-- ============================================================

-- L'expédition fait-elle partie d'une mission de MON entreprise (transporteur) ?
create or replace function public.is_shipment_in_my_missions(p_shipment uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from mission_shipments ms
    join missions m on m.id = ms.mission_id
    where ms.shipment_id = p_shipment
      and m.carrier_company_id = my_company()
  );
$$;

-- La mission transporte-t-elle une expédition de MON entreprise (expéditeur) ?
create or replace function public.is_mission_mine_as_shipper(p_mission uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from mission_shipments ms
    join shipments s on s.id = ms.shipment_id
    where ms.mission_id = p_mission
      and s.shipper_company_id = my_company()
  );
$$;

-- Redéfinition sans récursion : shipments
drop policy if exists "shipper sees own shipments" on shipments;
create policy "shipper sees own shipments" on shipments for select using (
  shipper_company_id = my_company()
  or my_role() = 'admin'
  or public.is_shipment_in_my_missions(id)
);

-- Redéfinition sans récursion : missions
drop policy if exists "carrier or shipper sees mission" on missions;
create policy "carrier or shipper sees mission" on missions for select using (
  carrier_company_id = my_company()
  or my_role() = 'admin'
  or public.is_mission_mine_as_shipper(id)
);

-- Fin correctif 007
