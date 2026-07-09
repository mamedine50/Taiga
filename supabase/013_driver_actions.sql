-- ============================================================
-- TAÏGA — App mobile chauffeur : action de statut sécurisée
-- À exécuter APRÈS 012, dans le SQL Editor.
--
-- La RLS interdit au transporteur de modifier une expédition directement.
-- Cette RPC security definer laisse le chauffeur (via le compte de son
-- entreprise) faire avancer le statut d'une expédition de SA mission :
-- ramassage → en_transit → livré, avec journal (status_events).
-- (Les POD passent par le bucket `pods` + table `pods`, déjà autorisés au
--  transporteur de la mission via migration 003.)
-- ============================================================

create or replace function public.driver_mark_status(
  p_mission  uuid,
  p_shipment uuid,
  p_status   text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_carrier uuid;
begin
  if p_status not in ('ramassage', 'en_transit', 'livre') then
    raise exception 'Statut invalide : %', p_status;
  end if;

  select carrier_company_id into v_carrier from missions where id = p_mission;
  if not found then raise exception 'Mission introuvable'; end if;
  if v_carrier <> my_company() then raise exception 'Mission non autorisée'; end if;
  if not exists (
    select 1 from mission_shipments where mission_id = p_mission and shipment_id = p_shipment
  ) then
    raise exception 'Expédition hors de cette mission';
  end if;

  update shipments set status = p_status::shipment_status where id = p_shipment;
  update missions set status = 'en_cours' where id = p_mission and status = 'acceptee';

  insert into status_events (shipment_id, mission_id, status, actor_profile_id)
  values (p_shipment, p_mission, p_status, auth.uid());

  -- Toutes les expéditions livrées → mission complétée.
  if p_status = 'livre' and not exists (
    select 1 from mission_shipments ms
    join shipments s on s.id = ms.shipment_id
    where ms.mission_id = p_mission and s.status <> 'livre'
  ) then
    update missions set status = 'completee' where id = p_mission;
  end if;
end;
$$;

revoke all on function public.driver_mark_status(uuid, uuid, text) from public;
grant execute on function public.driver_mark_status(uuid, uuid, text) to authenticated;

-- Fin migration 013
