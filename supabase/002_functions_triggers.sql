-- ============================================================
-- TAÏGA — Étape 2 : Logique métier (fonctions + triggers)
-- v1.0 — À exécuter APRÈS schema.sql, dans le SQL Editor de Supabase.
--
-- Contenu :
--   A. Création automatique du profil à l'inscription (auth.users → profiles)
--   B. Rollup automatique des évaluations (ratings → companies.rating_avg/count)
--   C. Maintien de shipments.updated_at sur modification directe
--   D. Fonction de cotation quote_shipment(shipment_id) — TPS/TVQ Québec
-- ============================================================

-- ------------------------------------------------------------
-- A. PROFIL AUTOMATIQUE À L'INSCRIPTION
--    Lit les métadonnées passées à supabase.auth.signUp({ options:{ data:{...} }})
--    Attendu dans raw_user_meta_data : full_name, role, language (optionnels)
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'shipper'),
    coalesce(new.raw_user_meta_data->>'language', 'fr')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- B. ROLLUP DES ÉVALUATIONS → companies
--    Recalcule la moyenne et le compteur de l'entreprise notée.
-- ------------------------------------------------------------
create or replace function public.recalc_company_rating()
returns trigger
language plpgsql
as $$
declare cid uuid;
begin
  cid := coalesce(new.to_company_id, old.to_company_id);
  update companies c set
    rating_avg = coalesce((select round(avg(stars)::numeric, 2) from ratings where to_company_id = cid), 0),
    rating_count = (select count(*) from ratings where to_company_id = cid)
  where c.id = cid;
  return null;
end;
$$;

drop trigger if exists trg_recalc_rating on ratings;
create trigger trg_recalc_rating
  after insert or update or delete on ratings
  for each row execute function public.recalc_company_rating();

-- ------------------------------------------------------------
-- C. updated_at SUR shipments (modification directe)
--    Le trigger de l'étape 1 ne rafraîchit updated_at que lors d'un
--    changement d'items ; celui-ci couvre les updates directs (statut, paiement…).
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_shipment on shipments;
create trigger trg_touch_shipment
  before update on shipments
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- D. FONCTION DE COTATION
--    quote_shipment(sid) :
--      1. sélectionne le tarif du corridor actif à la date demandée
--         (la ligne corridor_rates avec le effective_from <= requested_date le plus récent)
--      2. calcule fret, surcharges (carburant/saison), manutention, assurance
--      3. applique la remise « retour à vide » le cas échéant
--      4. calcule TPS (5 %) et TVQ (9,975 %) — taxes du Québec
--      5. écrit subtotal/gst/qst/total_amount/quote_breakdown dans le shipment
--      6. retourne le détail (jsonb)
--
--    Hypothèses (ajustables) :
--      • Palettes estimées = ceil(total_linear_ft / 4)  (1 palette non gerbable = 4 pi lin.)
--      • Assurance = insurance_pct % de declared_value
--      • Poids facturable déjà calculé par le trigger de l'étape 1 (max(réel, CBM×333))
-- ------------------------------------------------------------
create or replace function public.quote_shipment(sid uuid)
returns jsonb
language plpgsql
as $$
declare
  s            shipments%rowtype;
  r            corridor_rates%rowtype;
  v_pallets    numeric;
  v_freight    numeric;
  v_fuel       numeric;
  v_season     numeric;
  v_handling   numeric;
  v_insurance  numeric;
  v_discount   numeric := 0;
  v_subtotal   numeric;
  v_gst        numeric;
  v_qst        numeric;
  v_total      numeric;
  v_breakdown  jsonb;
  c_gst        constant numeric := 0.05;     -- TPS
  c_qst        constant numeric := 0.09975;  -- TVQ
begin
  select * into s from shipments where id = sid;
  if not found then
    raise exception 'Expédition % introuvable', sid;
  end if;
  if s.corridor_id is null then
    raise exception 'Aucun corridor défini pour l''expédition %', s.ref;
  end if;

  -- Tarif actif à la date demandée
  select * into r
  from corridor_rates
  where corridor_id = s.corridor_id
    and effective_from <= s.requested_date
    and (effective_to is null or effective_to >= s.requested_date)
  order by effective_from desc
  limit 1;
  if not found then
    raise exception 'Aucun tarif applicable pour le corridor % à la date %', s.corridor_id, s.requested_date;
  end if;

  -- Fret de base (plancher = min_charge)
  v_freight  := greatest(round(s.chargeable_weight_kg * r.rate_per_kg, 2), r.min_charge);

  -- Surcharges (calculées sur le fret)
  v_fuel     := round(v_freight * r.fuel_surcharge_pct   / 100.0, 2);
  v_season   := round(v_freight * r.season_surcharge_pct / 100.0, 2);

  -- Manutention par palette
  v_pallets  := greatest(ceil(coalesce(s.total_linear_ft, 0) / 4.0), 0);
  v_handling := round(v_pallets * r.handling_per_pallet, 2);

  -- Assurance sur valeur déclarée
  v_insurance := round(coalesce(s.declared_value, 0) * r.insurance_pct / 100.0, 2);

  -- Remise retour à vide (appliquée au fret + surcharges)
  if s.is_backhaul and coalesce(s.backhaul_discount_pct, 0) > 0 then
    v_discount := round((v_freight + v_fuel + v_season) * s.backhaul_discount_pct / 100.0, 2);
  end if;

  v_subtotal := round(v_freight + v_fuel + v_season + v_handling + v_insurance - v_discount, 2);
  v_gst      := round(v_subtotal * c_gst, 2);
  v_qst      := round(v_subtotal * c_qst, 2);
  v_total    := round(v_subtotal + v_gst + v_qst, 2);

  v_breakdown := jsonb_build_object(
    'corridor_id',        s.corridor_id,
    'rate_id',            r.id,
    'season',             r.season,
    'chargeable_weight_kg', s.chargeable_weight_kg,
    'rate_per_kg',        r.rate_per_kg,
    'lines', jsonb_build_array(
      jsonb_build_object('code','fret',       'label','Fret (poids facturable)',        'amount', v_freight),
      jsonb_build_object('code','carburant',  'label','Surcharge carburant',            'amount', v_fuel,     'pct', r.fuel_surcharge_pct),
      jsonb_build_object('code','saison',     'label','Surcharge saisonnière',          'amount', v_season,   'pct', r.season_surcharge_pct),
      jsonb_build_object('code','manutention','label','Manutention', 'amount', v_handling, 'pallets', v_pallets, 'per_pallet', r.handling_per_pallet),
      jsonb_build_object('code','assurance',  'label','Assurance',                       'amount', v_insurance,'pct', r.insurance_pct),
      jsonb_build_object('code','remise_retour','label','Remise retour à vide',         'amount', -v_discount, 'pct', s.backhaul_discount_pct)
    ),
    'subtotal', v_subtotal,
    'tps',      v_gst,
    'tvq',      v_qst,
    'total',    v_total,
    'currency', s.currency
  );

  update shipments set
    subtotal      = v_subtotal,
    gst           = v_gst,
    qst           = v_qst,
    total_amount  = v_total,
    quote_breakdown = v_breakdown,
    status        = case when status = 'brouillon' then 'cote'::shipment_status else status end
  where id = sid;

  return v_breakdown;
end;
$$;

-- Fin étape 2
