-- ============================================================
-- TAÏGA — Preuve de livraison (POD) : commit atomique
-- À exécuter APRÈS 013, dans le SQL Editor.
--
-- Le chauffeur monte d'abord les fichiers (bucket `pods`, chemins
-- déterministes en upsert), puis appelle submit_pod() : UNE transaction
-- qui écrit la ligne pods + passe l'expédition à « livré » + journalise +
-- complète la mission si tout est livré. Idempotent (upsert sur shipment_id)
-- → un réessai après échec partiel ne crée jamais de POD à moitié synchronisé.
-- ============================================================

-- 1 POD par expédition → permet l'upsert idempotent.
alter table pods drop constraint if exists pods_shipment_unique;
alter table pods add constraint pods_shipment_unique unique (shipment_id);

create or replace function public.submit_pod(
  p_mission     uuid,
  p_shipment    uuid,
  p_photo_urls  text[],
  p_signature_url text,
  p_signee      text,
  p_damages     boolean,
  p_notes       text,
  p_lat         numeric,
  p_lng         numeric,
  p_captured_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_carrier uuid;
begin
  select carrier_company_id into v_carrier from missions where id = p_mission;
  if not found then raise exception 'Mission introuvable'; end if;
  if v_carrier <> my_company() then raise exception 'Mission non autorisée'; end if;
  if not exists (
    select 1 from mission_shipments where mission_id = p_mission and shipment_id = p_shipment
  ) then
    raise exception 'Expédition hors de cette mission';
  end if;

  insert into pods (mission_id, shipment_id, photo_urls, signature_url, signee_name,
                    damages, notes, lat, lng, captured_at)
  values (p_mission, p_shipment, coalesce(p_photo_urls, '{}'), p_signature_url, p_signee,
          coalesce(p_damages, false), nullif(btrim(coalesce(p_notes, '')), ''),
          p_lat, p_lng, coalesce(p_captured_at, now()))
  on conflict (shipment_id) do update set
    photo_urls    = excluded.photo_urls,
    signature_url = excluded.signature_url,
    signee_name   = excluded.signee_name,
    damages       = excluded.damages,
    notes         = excluded.notes,
    lat           = excluded.lat,
    lng           = excluded.lng,
    captured_at   = excluded.captured_at;

  update shipments set status = 'livre' where id = p_shipment;
  insert into status_events (shipment_id, mission_id, status, actor_profile_id)
  values (p_shipment, p_mission, 'livre', auth.uid());

  if not exists (
    select 1 from mission_shipments ms
    join shipments s on s.id = ms.shipment_id
    where ms.mission_id = p_mission and s.status <> 'livre'
  ) then
    update missions set status = 'completee' where id = p_mission;
  end if;
end;
$$;

revoke all on function public.submit_pod(uuid, uuid, text[], text, text, boolean, text, numeric, numeric, timestamptz) from public;
grant execute on function public.submit_pod(uuid, uuid, text[], text, text, boolean, text, numeric, numeric, timestamptz) to authenticated;

-- Fin migration 014
