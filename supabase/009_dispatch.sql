-- ============================================================
-- TAÏGA — Phase 3 : Poste de commandement (assignation 1-à-1)
-- À exécuter APRÈS 008, dans le SQL Editor.
--
-- A. Politiques RLS manquantes : drivers, vehicles, mission_shipments.
-- B. RPC atomiques (security definer) :
--    - assign_shipment_to_carrier : l'admin crée une mission « offerte ».
--    - accept_mission : le transporteur accepte (règle artisan : 1 chauffeur +
--      1 véhicule actifs → auto-assignation ; sinon sélection requise).
--    - refuse_mission : le transporteur refuse.
-- ============================================================

-- ---------- A. RLS ----------
alter table drivers enable row level security;
drop policy if exists "drivers: read" on drivers;
create policy "drivers: read" on drivers for select
  using (company_id = my_company() or my_role() = 'admin');
drop policy if exists "drivers: write" on drivers;
create policy "drivers: write" on drivers for all
  using (company_id = my_company()) with check (company_id = my_company());

alter table vehicles enable row level security;
drop policy if exists "vehicles: read" on vehicles;
create policy "vehicles: read" on vehicles for select
  using (company_id = my_company() or my_role() = 'admin');
drop policy if exists "vehicles: write" on vehicles;
create policy "vehicles: write" on vehicles for all
  using (company_id = my_company()) with check (company_id = my_company());

alter table mission_shipments enable row level security;
drop policy if exists "mission_shipments: read" on mission_shipments;
create policy "mission_shipments: read" on mission_shipments for select using (
  my_role() = 'admin'
  or exists (select 1 from missions m where m.id = mission_id and m.carrier_company_id = my_company())
  or exists (select 1 from shipments s where s.id = shipment_id and s.shipper_company_id = my_company())
);

-- ---------- B. RPC ----------

-- Admin : assigne une expédition cotée à un transporteur vérifié (mission offerte).
create or replace function public.assign_shipment_to_carrier(
  p_shipment       uuid,
  p_carrier        uuid,
  p_carrier_payout numeric,
  p_platform_fee   numeric,
  p_expires_hours  int default 48
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mission  uuid;
  v_verified boolean;
  v_ctype    company_type;
begin
  if my_role() <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;

  select verified, type into v_verified, v_ctype from companies where id = p_carrier;
  if not found then raise exception 'Transporteur introuvable'; end if;
  if v_ctype <> 'carrier' then raise exception 'L''entreprise n''est pas un transporteur'; end if;
  if not coalesce(v_verified, false) then raise exception 'Transporteur non vérifié'; end if;

  if not exists (select 1 from shipments where id = p_shipment) then
    raise exception 'Expédition introuvable';
  end if;

  if exists (
    select 1 from mission_shipments ms
    join missions m on m.id = ms.mission_id
    where ms.shipment_id = p_shipment and m.status in ('offerte', 'acceptee', 'en_cours')
  ) then
    raise exception 'Expédition déjà offerte ou assignée';
  end if;

  insert into missions (carrier_company_id, status, offered_at, expires_at,
                        carrier_payout_amount, platform_fee_amount)
  values (p_carrier, 'offerte', now(), now() + make_interval(hours => p_expires_hours),
          p_carrier_payout, p_platform_fee)
  returning id into v_mission;

  insert into mission_shipments (mission_id, shipment_id) values (v_mission, p_shipment);

  return v_mission;
end;
$$;

-- Transporteur : accepte une mission offerte (règle artisan intégrée).
create or replace function public.accept_mission(
  p_mission uuid,
  p_driver  uuid default null,
  p_vehicle uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_carrier uuid;
  v_status  mission_status;
  v_expires timestamptz;
  v_driver  uuid := p_driver;
  v_vehicle uuid := p_vehicle;
  v_dcount  int;
  v_vcount  int;
begin
  select carrier_company_id, status, expires_at
    into v_carrier, v_status, v_expires
  from missions where id = p_mission;
  if not found then raise exception 'Mission introuvable'; end if;
  if v_carrier <> my_company() then raise exception 'Cette mission ne vous appartient pas'; end if;
  if v_status <> 'offerte' then raise exception 'Mission non offerte'; end if;
  if v_expires is not null and v_expires < now() then
    update missions set status = 'expiree' where id = p_mission;
    raise exception 'Offre expirée';
  end if;

  select count(*) into v_dcount from drivers where company_id = v_carrier and active;
  select count(*) into v_vcount from vehicles where company_id = v_carrier and active;

  -- Chauffeur
  if v_driver is null then
    if v_dcount = 1 then
      select id into v_driver from drivers where company_id = v_carrier and active;
    elsif v_dcount = 0 then
      raise exception 'Aucun chauffeur actif';
    else
      raise exception 'Sélection du chauffeur requise';
    end if;
  elsif not exists (select 1 from drivers where id = v_driver and company_id = v_carrier and active) then
    raise exception 'Chauffeur invalide';
  end if;

  -- Véhicule
  if v_vehicle is null then
    if v_vcount = 1 then
      select id into v_vehicle from vehicles where company_id = v_carrier and active;
    elsif v_vcount = 0 then
      raise exception 'Aucun véhicule actif';
    else
      raise exception 'Sélection du véhicule requise';
    end if;
  elsif not exists (select 1 from vehicles where id = v_vehicle and company_id = v_carrier and active) then
    raise exception 'Véhicule invalide';
  end if;

  update missions
    set status = 'acceptee', accepted_at = now(), driver_id = v_driver, vehicle_id = v_vehicle
  where id = p_mission;

  update shipments set status = 'assigne'
  where id in (select shipment_id from mission_shipments where mission_id = p_mission);
end;
$$;

-- Transporteur : refuse une mission offerte.
create or replace function public.refuse_mission(p_mission uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_carrier uuid;
  v_status  mission_status;
begin
  select carrier_company_id, status into v_carrier, v_status from missions where id = p_mission;
  if not found then raise exception 'Mission introuvable'; end if;
  if v_carrier <> my_company() then raise exception 'Non autorisé'; end if;
  if v_status <> 'offerte' then raise exception 'Mission non offerte'; end if;
  update missions set status = 'refusee' where id = p_mission;
end;
$$;

revoke all on function public.assign_shipment_to_carrier(uuid, uuid, numeric, numeric, int) from public;
grant execute on function public.assign_shipment_to_carrier(uuid, uuid, numeric, numeric, int) to authenticated;
revoke all on function public.accept_mission(uuid, uuid, uuid) from public;
grant execute on function public.accept_mission(uuid, uuid, uuid) to authenticated;
revoke all on function public.refuse_mission(uuid) from public;
grant execute on function public.refuse_mission(uuid) to authenticated;

-- Fin Phase 3 (migration 009)
