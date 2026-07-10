-- ============================================================
-- TAÏGA — Paiement + facturation
-- À exécuter APRÈS 015, dans le SQL Editor.
--
-- Réservation (autorisation Stripe manual capture) → confirm_reservation
-- Capture (à la livraison, Edge Function) → mark_captured / mark_capture_failed
-- Toutes idempotentes ; échec de capture = payment_status 'echoue' + notif admin.
-- Fonctions réservées au rôle service (appelées par le webhook / l'Edge Function).
-- ============================================================

create sequence if not exists invoice_number_seq;

create or replace function public.next_invoice_number()
returns text language sql security definer set search_path = public as $$
  select 'INV-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('invoice_number_seq')::text, 4, '0');
$$;

-- Réservation confirmée (autorisation réussie) : facture + statut réservé/retenu.
create or replace function public.confirm_reservation(
  p_shipment       uuid,
  p_payment_intent text,
  p_number         text,
  p_pdf_path       text
)
returns void language plpgsql security definer set search_path = public as $$
declare s shipments%rowtype;
begin
  select * into s from shipments where id = p_shipment;
  if not found then raise exception 'Expédition introuvable'; end if;
  if s.payment_status = 'retenu' then return; end if; -- idempotent

  insert into invoices (shipment_id, number, pdf_url, subtotal, gst, qst, total)
  values (p_shipment, p_number, p_pdf_path, s.subtotal, s.gst, s.qst, s.total_amount)
  on conflict (shipment_id) do nothing;

  update shipments
    set status = 'reserve', payment_status = 'retenu', stripe_payment_intent_id = p_payment_intent
  where id = p_shipment;
end; $$;

-- Capture réussie : enregistre le versement dû au transporteur (idempotent).
create or replace function public.mark_captured(p_shipment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_mission uuid; v_carrier uuid; v_payout numeric;
begin
  select ms.mission_id, m.carrier_company_id, m.carrier_payout_amount
    into v_mission, v_carrier, v_payout
  from mission_shipments ms
  join missions m on m.id = ms.mission_id
  where ms.shipment_id = p_shipment
  order by m.created_at desc
  limit 1;

  if v_mission is not null and not exists (select 1 from payouts where mission_id = v_mission) then
    insert into payouts (mission_id, carrier_company_id, amount, status)
    values (v_mission, v_carrier, coalesce(v_payout, 0), 'en_attente');
  end if;
  -- payment_status reste 'retenu' : fonds captés, en attente du versement transporteur.
end; $$;

-- Capture échouée : statut 'echoue' + notification à tous les admins (jamais silencieux).
create or replace function public.mark_capture_failed(p_shipment uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_ref text; a record;
begin
  update shipments set payment_status = 'echoue' where id = p_shipment;
  select ref into v_ref from shipments where id = p_shipment;
  for a in select id from profiles where role = 'admin' loop
    insert into notifications (profile_id, channel, title, body, link)
    values (a.id, 'interne', 'Échec de capture de paiement',
            format('%s : %s', coalesce(v_ref, '?'), coalesce(p_reason, 'erreur inconnue')), '/admin');
  end loop;
end; $$;

revoke all on function public.next_invoice_number() from public;
revoke all on function public.confirm_reservation(uuid, text, text, text) from public;
revoke all on function public.mark_captured(uuid) from public;
revoke all on function public.mark_capture_failed(uuid, text) from public;
grant execute on function public.next_invoice_number() to service_role;
grant execute on function public.confirm_reservation(uuid, text, text, text) to service_role;
grant execute on function public.mark_captured(uuid) to service_role;
grant execute on function public.mark_capture_failed(uuid, text) to service_role;

-- ---------- RLS lecture : factures & versements ----------
alter table invoices enable row level security;
drop policy if exists "invoices: read shipper or admin" on invoices;
create policy "invoices: read shipper or admin" on invoices for select using (
  my_role() = 'admin'
  or exists (
    select 1 from shipments s
    where s.id = invoices.shipment_id and s.shipper_company_id = my_company()
  )
);

alter table payouts enable row level security;
drop policy if exists "payouts: read carrier or admin" on payouts;
create policy "payouts: read carrier or admin" on payouts for select using (
  carrier_company_id = my_company() or my_role() = 'admin'
);

-- Fin migration 016
