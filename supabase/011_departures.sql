-- ============================================================
-- TAÏGA — Phase suivante : Départs groupés (consolidation LTL)
-- À exécuter APRÈS 010, dans le SQL Editor.
--
-- Modèle « remplir puis confier » :
--   1. L'admin crée un départ (corridor + date + terminal + capacité planifiée).
--   2. Il y ajoute des expéditions cotées (shipments.departure_id) → la jauge
--      booked_kg/cbm/linear_ft se recalcule automatiquement (trigger).
--   3. Il confie le départ à un transporteur → UNE mission (departure_id)
--      groupant toutes les expéditions via mission_shipments.
-- ============================================================

-- ---------- Lien permanent expédition ↔ départ ----------
alter table shipments add column if not exists departure_id uuid references departures(id);
create index if not exists idx_shipments_departure on shipments (departure_id);

-- ---------- Jauge : recalcul de booked_* ----------
create or replace function public.recalc_departure_booking()
returns trigger
language plpgsql
as $$
declare
  old_d uuid := case when tg_op in ('UPDATE', 'DELETE') then old.departure_id else null end;
  new_d uuid := case when tg_op in ('UPDATE', 'INSERT') then new.departure_id else null end;
  d uuid;
begin
  foreach d in array array[old_d, new_d] loop
    if d is not null then
      update departures dep set
        booked_kg        = coalesce((select sum(total_weight_kg) from shipments where departure_id = d), 0),
        booked_cbm       = coalesce((select sum(total_cbm)        from shipments where departure_id = d), 0),
        booked_linear_ft = coalesce((select sum(total_linear_ft)  from shipments where departure_id = d), 0)
      where dep.id = d;
    end if;
  end loop;
  return null;
end;
$$;

drop trigger if exists trg_departure_booking on shipments;
create trigger trg_departure_booking
  after insert or update or delete on shipments
  for each row execute function public.recalc_departure_booking();

-- ---------- RLS départs ----------
alter table departures enable row level security;
drop policy if exists "departures: read" on departures;
create policy "departures: read" on departures for select using (
  my_role() = 'admin'
  or exists (select 1 from missions m where m.departure_id = departures.id and m.carrier_company_id = my_company())
  or exists (select 1 from shipments s where s.departure_id = departures.id and s.shipper_company_id = my_company())
);

-- ---------- RPC ----------

create or replace function public.create_departure(
  p_corridor uuid,
  p_date     date,
  p_terminal text,
  p_cap_kg   numeric,
  p_cap_cbm  numeric,
  p_cap_lf   numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if my_role() <> 'admin' then raise exception 'Réservé à l''administrateur'; end if;
  insert into departures (corridor_id, departure_date, terminal_city,
                          capacity_kg, capacity_cbm, capacity_linear_ft, status)
  values (p_corridor, p_date, p_terminal, p_cap_kg, p_cap_cbm, p_cap_lf, 'ouvert')
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.add_shipment_to_departure(p_departure uuid, p_shipment uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dep_corridor uuid;
  v_ship_corridor uuid;
  v_status shipment_status;
  v_dep_status text;
begin
  if my_role() <> 'admin' then raise exception 'Réservé à l''administrateur'; end if;

  select corridor_id, status into v_dep_corridor, v_dep_status from departures where id = p_departure;
  if not found then raise exception 'Départ introuvable'; end if;
  if v_dep_status <> 'ouvert' then raise exception 'Départ non ouvert'; end if;

  select corridor_id, status into v_ship_corridor, v_status from shipments where id = p_shipment;
  if not found then raise exception 'Expédition introuvable'; end if;
  if v_status <> 'cote' then raise exception 'Seules les expéditions cotées peuvent être groupées'; end if;
  if v_ship_corridor is distinct from v_dep_corridor then
    raise exception 'L''expédition n''est pas sur le corridor du départ';
  end if;
  if exists (
    select 1 from mission_shipments ms join missions m on m.id = ms.mission_id
    where ms.shipment_id = p_shipment and m.status in ('offerte','acceptee','en_cours')
  ) then
    raise exception 'Expédition déjà offerte ou assignée';
  end if;

  update shipments set departure_id = p_departure where id = p_shipment;
end;
$$;

create or replace function public.remove_shipment_from_departure(p_shipment uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if my_role() <> 'admin' then raise exception 'Réservé à l''administrateur'; end if;
  update shipments set departure_id = null where id = p_shipment;
end;
$$;

-- Confier tout le départ à un transporteur : une mission groupant ses expéditions.
create or replace function public.assign_departure_to_carrier(
  p_departure      uuid,
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
  v_count    int;
  r          record;
begin
  if my_role() <> 'admin' then raise exception 'Réservé à l''administrateur'; end if;

  select verified, type into v_verified, v_ctype from companies where id = p_carrier;
  if not found then raise exception 'Transporteur introuvable'; end if;
  if v_ctype <> 'carrier' then raise exception 'L''entreprise n''est pas un transporteur'; end if;
  if not coalesce(v_verified, false) then raise exception 'Transporteur non vérifié'; end if;

  select count(*) into v_count from shipments where departure_id = p_departure and status = 'cote';
  if v_count = 0 then raise exception 'Aucune expédition cotée dans ce départ'; end if;

  insert into missions (carrier_company_id, departure_id, status, offered_at, expires_at,
                        carrier_payout_amount, platform_fee_amount)
  values (p_carrier, p_departure, 'offerte', now(), now() + make_interval(hours => p_expires_hours),
          p_carrier_payout, p_platform_fee)
  returning id into v_mission;

  for r in select id from shipments where departure_id = p_departure and status = 'cote' loop
    insert into mission_shipments (mission_id, shipment_id) values (v_mission, r.id);
  end loop;

  update departures set status = 'complet' where id = p_departure;
  return v_mission;
end;
$$;

revoke all on function public.create_departure(uuid, date, text, numeric, numeric, numeric) from public;
grant execute on function public.create_departure(uuid, date, text, numeric, numeric, numeric) to authenticated;
revoke all on function public.add_shipment_to_departure(uuid, uuid) from public;
grant execute on function public.add_shipment_to_departure(uuid, uuid) to authenticated;
revoke all on function public.remove_shipment_from_departure(uuid) from public;
grant execute on function public.remove_shipment_from_departure(uuid) to authenticated;
revoke all on function public.assign_departure_to_carrier(uuid, uuid, numeric, numeric, int) from public;
grant execute on function public.assign_departure_to_carrier(uuid, uuid, numeric, numeric, int) to authenticated;

-- Fin migration 011 (départs groupés)
