-- ============================================================
-- TAÏGA — Plateforme de transport & logistique Québec
-- Schéma Supabase (PostgreSQL) — v1.1
-- À coller dans l'éditeur SQL de Supabase (projet Taiga), en une seule exécution.
--
-- Changements v1.1 (vs v1.0) :
--   • Section 10 (RLS) complétée : politiques pour TOUTES les tables où
--     `enable row level security` est activé. En v1.0, 5 tables avaient la RLS
--     activée SANS aucune politique → deny-all → l'app aurait été bloquée.
-- ============================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "uuid-ossp";
create extension if not exists postgis; -- géolocalisation (optionnel mais recommandé)

-- ---------- ENUMS ----------
create type user_role as enum ('shipper','carrier','driver','admin');
create type company_type as enum ('shipper','carrier');
create type doc_type as enum ('assurance_cargo','assurance_responsabilite','pevl','permis_conduire','immatriculation','autre');
create type doc_status as enum ('en_attente','valide','expire','refuse');
create type vehicle_type as enum ('dry_van_53','dry_van_48','flatbed','reefer','cube','pickup_remorque','autre');
create type telematics_type as enum ('cellulaire','satellite','aucun');
create type coverage_level as enum ('complete','partielle','aucune');
create type season as enum ('ete','hiver','degel');
create type shipment_status as enum ('brouillon','cote','reserve','assigne','ramassage','en_transit','livre','complete','annule','litige');
create type payment_status as enum ('en_attente','retenu','verse','rembourse','echoue');
create type mission_status as enum ('offerte','acceptee','refusee','expiree','en_cours','completee','annulee');
create type stop_type as enum ('ramassage','terminal','livraison');
create type tracking_source as enum ('cellulaire','satellite','manuel');
create type payout_status as enum ('en_attente','en_cours','verse','echoue');
create type notif_channel as enum ('push','sms','courriel','interne');
create type dispute_status as enum ('ouvert','en_analyse','resolu','ferme');

-- ============================================================
-- 1. ORGANISATIONS ET UTILISATEURS
-- ============================================================

create table companies (
  id uuid primary key default uuid_generate_v4(),
  type company_type not null,
  legal_name text not null,
  neq text,                                   -- Numéro d'entreprise du Québec
  address text, city text, province text default 'QC', postal_code text,
  phone text, email text,
  language text default 'fr' check (language in ('fr','en')),
  verified boolean default false,             -- validé par l'admin (docs en règle)
  stripe_customer_id text,                    -- expéditeur : payeur
  stripe_account_id text,                     -- transporteur : compte Connect (versements)
  rating_avg numeric(3,2) default 0,
  rating_count int default 0,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'shipper',
  company_id uuid references companies(id),
  full_name text not null,
  phone text,
  language text default 'fr' check (language in ('fr','en')),
  push_token text,                            -- Expo push token (chauffeurs)
  created_at timestamptz default now()
);

create table carrier_documents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  type doc_type not null,
  file_url text not null,                     -- Supabase Storage
  expires_at date,
  status doc_status default 'en_attente',
  reviewed_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- 2. FLOTTE
-- ============================================================

create table vehicles (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  unit_number text not null,
  type vehicle_type not null,
  plate text,
  capacity_kg numeric(10,2) not null,
  capacity_cbm numeric(10,2) not null,        -- volume utile en m³
  linear_feet numeric(5,1) default 53,        -- longueur utile
  telematics telematics_type default 'cellulaire',
  telematics_device_id text,                  -- ID du traceur satellite le cas échéant
  active boolean default true,
  created_at timestamptz default now()
);

create table drivers (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid unique references profiles(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  license_number text,
  license_class text default '1',
  active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. CORRIDORS ET TARIFICATION SAISONNIÈRE
-- ============================================================

create table corridors (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,                  -- ex. 'N-04'
  name text not null,                         -- ex. 'Val-d''Or → Baie-James Est'
  origin_region text not null,
  dest_region text not null,
  distance_km numeric(7,1),
  cellular_coverage coverage_level default 'complete',
  service_days text[],                        -- ex. {'mardi','jeudi'} départs groupés
  requires_satellite boolean default false,
  active boolean default true
);

create table corridor_rates (
  id uuid primary key default uuid_generate_v4(),
  corridor_id uuid not null references corridors(id) on delete cascade,
  season season not null,
  effective_from date not null,
  effective_to date,
  rate_per_kg numeric(8,4) not null,          -- $/kg facturable
  min_charge numeric(10,2) not null,          -- minimum par envoi
  fuel_surcharge_pct numeric(5,2) default 0,
  season_surcharge_pct numeric(5,2) default 0, -- hiver / dégel
  handling_per_pallet numeric(8,2) default 0,  -- manutention/consolidation
  insurance_pct numeric(5,2) default 0,        -- % de la valeur déclarée
  unique (corridor_id, season, effective_from)
);

-- ============================================================
-- 4. EXPÉDITIONS (le cœur)
-- ============================================================

create sequence shipment_ref_seq;

create table shipments (
  id uuid primary key default uuid_generate_v4(),
  ref text unique not null default (
    'TG-' || to_char(now(),'YYMM') || '-' || lpad(nextval('shipment_ref_seq')::text, 4, '0')
  ),
  shipper_company_id uuid not null references companies(id),
  created_by uuid not null references profiles(id),
  -- Origine / destination
  origin_address text not null, origin_city text not null,
  origin_lat numeric(9,6), origin_lng numeric(9,6),
  dest_address text not null, dest_city text not null,
  dest_lat numeric(9,6), dest_lng numeric(9,6),
  corridor_id uuid references corridors(id),
  requested_date date not null,
  flexible boolean default true,
  declared_value numeric(12,2),
  -- Totaux calculés depuis shipment_items (trigger)
  total_weight_kg numeric(10,2) default 0,
  total_cbm numeric(10,3) default 0,          -- ← CBM total
  total_linear_ft numeric(6,1) default 0,     -- ← pieds linéaires (non-gerbable)
  chargeable_weight_kg numeric(10,2) default 0, -- max(réel, CBM×333)
  -- Prix
  quote_breakdown jsonb,                      -- détail de la cotation (lignes)
  subtotal numeric(10,2), gst numeric(10,2), qst numeric(10,2),
  total_amount numeric(10,2),
  currency text default 'CAD',
  -- Paiement
  stripe_payment_intent_id text,
  payment_status payment_status default 'en_attente',
  -- Cycle de vie
  status shipment_status default 'brouillon',
  is_backhaul boolean default false,          -- envoi sur retour à vide
  backhaul_discount_pct numeric(5,2) default 0,
  special_instructions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table shipment_items (
  id uuid primary key default uuid_generate_v4(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  description text not null,
  qty int not null default 1,
  length_cm numeric(7,1) not null,
  width_cm numeric(7,1) not null,
  height_cm numeric(7,1) not null,
  weight_kg_each numeric(9,2) not null,
  stackable boolean default true,             -- ← gerbable oui/non
  dangerous_goods boolean default false,
  -- CBM calculé automatiquement
  cbm numeric(10,3) generated always as (
    (length_cm * width_cm * height_cm * qty) / 1000000.0
  ) stored,
  notes text
);

-- Trigger : recalcul des totaux + poids facturable (facteur routier 1 m³ = 333 kg)
create or replace function recalc_shipment_totals() returns trigger as $$
declare sid uuid;
begin
  sid := coalesce(new.shipment_id, old.shipment_id);
  update shipments s set
    total_weight_kg = t.w,
    total_cbm = t.v,
    total_linear_ft = t.lf,
    chargeable_weight_kg = greatest(t.w, t.v * 333),
    updated_at = now()
  from (
    select
      coalesce(sum(weight_kg_each * qty),0) as w,
      coalesce(sum(cbm),0) as v,
      -- palette std 48 po ≈ 4 pi linéaires si non gerbable, sinon /2 (empilage)
      coalesce(sum(case when stackable then qty*2.0 else qty*4.0 end),0) as lf
    from shipment_items where shipment_id = sid
  ) t
  where s.id = sid;
  return null;
end; $$ language plpgsql;

create trigger trg_recalc_totals
after insert or update or delete on shipment_items
for each row execute function recalc_shipment_totals();

-- ============================================================
-- 5. DÉPARTS GROUPÉS (consolidation LTL)
-- ============================================================

create table departures (
  id uuid primary key default uuid_generate_v4(),
  corridor_id uuid not null references corridors(id),
  departure_date date not null,
  terminal_city text not null,                -- ex. 'Val-d''Or'
  vehicle_id uuid references vehicles(id),
  driver_id uuid references drivers(id),
  capacity_kg numeric(10,2), capacity_cbm numeric(10,2), capacity_linear_ft numeric(6,1),
  booked_kg numeric(10,2) default 0,
  booked_cbm numeric(10,2) default 0,
  booked_linear_ft numeric(6,1) default 0,
  status text default 'ouvert' check (status in ('ouvert','complet','parti','arrive','ferme')),
  created_at timestamptz default now()
);

-- ============================================================
-- 6. MISSIONS (assignation transporteur/chauffeur)
-- ============================================================

create table missions (
  id uuid primary key default uuid_generate_v4(),
  carrier_company_id uuid not null references companies(id),
  driver_id uuid references drivers(id),
  vehicle_id uuid references vehicles(id),
  departure_id uuid references departures(id), -- null si FTL direct
  status mission_status default 'offerte',
  offered_at timestamptz default now(),
  expires_at timestamptz,                      -- offre limitée dans le temps
  accepted_at timestamptz,
  carrier_payout_amount numeric(10,2) not null,
  platform_fee_amount numeric(10,2) not null,  -- ta marge
  payout_status payout_status default 'en_attente',
  created_at timestamptz default now()
);

-- Une mission peut regrouper plusieurs expéditions (groupage)
create table mission_shipments (
  mission_id uuid references missions(id) on delete cascade,
  shipment_id uuid references shipments(id) on delete cascade,
  primary key (mission_id, shipment_id)
);

create table mission_stops (
  id uuid primary key default uuid_generate_v4(),
  mission_id uuid not null references missions(id) on delete cascade,
  seq int not null,
  type stop_type not null,
  shipment_id uuid references shipments(id),
  address text, city text,
  lat numeric(9,6), lng numeric(9,6),
  scheduled_at timestamptz,
  completed_at timestamptz,
  offline_captured boolean default false
);

-- ============================================================
-- 7. SUIVI, POD, ÉVÉNEMENTS
-- ============================================================

create table tracking_points (
  id bigint generated always as identity primary key,
  mission_id uuid not null references missions(id) on delete cascade,
  lat numeric(9,6) not null, lng numeric(9,6) not null,
  speed_kmh numeric(5,1),
  source tracking_source not null default 'cellulaire',
  recorded_at timestamptz not null,            -- moment réel de la capture
  synced_at timestamptz default now()          -- moment de réception serveur
);
create index idx_tracking_mission_time on tracking_points (mission_id, recorded_at desc);

create table pods (
  id uuid primary key default uuid_generate_v4(),
  mission_id uuid not null references missions(id),
  shipment_id uuid not null references shipments(id),
  photo_urls text[] not null default '{}',
  signature_url text,
  signee_name text,
  damages boolean default false,
  notes text,
  lat numeric(9,6), lng numeric(9,6),
  captured_at timestamptz not null,            -- horodatage hors-ligne
  synced_at timestamptz default now()
);

create table status_events (
  id bigint generated always as identity primary key,
  shipment_id uuid references shipments(id) on delete cascade,
  mission_id uuid references missions(id),
  status text not null,
  actor_profile_id uuid references profiles(id),
  offline_captured boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- 8. FACTURATION, VERSEMENTS, ÉVALUATIONS, LITIGES
-- ============================================================

create table invoices (
  id uuid primary key default uuid_generate_v4(),
  shipment_id uuid unique not null references shipments(id),
  number text unique not null,
  pdf_url text,
  subtotal numeric(10,2), gst numeric(10,2), qst numeric(10,2), total numeric(10,2),
  issued_at timestamptz default now()
);

create table payouts (
  id uuid primary key default uuid_generate_v4(),
  mission_id uuid not null references missions(id),
  carrier_company_id uuid not null references companies(id),
  amount numeric(10,2) not null,
  stripe_transfer_id text,
  status payout_status default 'en_attente',
  paid_at timestamptz
);

create table ratings (
  id uuid primary key default uuid_generate_v4(),
  shipment_id uuid not null references shipments(id),
  from_profile_id uuid not null references profiles(id),
  to_company_id uuid not null references companies(id),
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (shipment_id, from_profile_id)
);

create table disputes (
  id uuid primary key default uuid_generate_v4(),
  shipment_id uuid not null references shipments(id),
  opened_by uuid not null references profiles(id),
  reason text not null,
  status dispute_status default 'ouvert',
  resolution text,
  created_at timestamptz default now()
);

create table messages (
  id bigint generated always as identity primary key,
  shipment_id uuid not null references shipments(id) on delete cascade,
  from_profile_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz default now()
);

create table notifications (
  id bigint generated always as identity primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  channel notif_channel default 'interne',
  title text not null,
  body text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- 9. RETOURS À VIDE (backhauls)
-- ============================================================

create table backhaul_offers (
  id uuid primary key default uuid_generate_v4(),
  mission_id uuid references missions(id),
  carrier_company_id uuid not null references companies(id),
  origin_city text not null,
  dest_city text not null,
  available_date date not null,
  capacity_kg numeric(10,2), capacity_cbm numeric(10,2), capacity_linear_ft numeric(6,1),
  discount_pct numeric(5,2) default 40,
  status text default 'publie' check (status in ('publie','reserve','expire')),
  created_at timestamptz default now()
);

-- ============================================================
-- 10. RLS — SÉCURITÉ PAR RÔLE
-- ============================================================

alter table companies enable row level security;
alter table profiles enable row level security;
alter table shipments enable row level security;
alter table shipment_items enable row level security;
alter table missions enable row level security;
alter table tracking_points enable row level security;
alter table pods enable row level security;

-- Helpers (security definer → contournent la RLS pour lire le profil courant)
create or replace function my_company() returns uuid as $$
  select company_id from profiles where id = auth.uid()
$$ language sql stable security definer;

create or replace function my_role() returns user_role as $$
  select role from profiles where id = auth.uid()
$$ language sql stable security definer;

-- ---------- PROFILES ----------
create policy "own profile" on profiles for select
  using (id = auth.uid() or my_role() = 'admin');
create policy "update own profile" on profiles for update
  using (id = auth.uid());
-- (l'insertion du profil se fait normalement via un trigger/handler à l'inscription,
--  exécuté avec le rôle service ; ajoutez une politique insert si besoin côté client)

-- ---------- COMPANIES ----------
-- Marketplace : tout utilisateur authentifié peut LIRE l'annuaire des entreprises
-- (nécessaire pour afficher les noms d'expéditeurs/transporteurs sur les missions).
-- Écriture réservée à sa propre entreprise et à l'admin.
create policy "read companies (authenticated)" on companies for select
  using (auth.uid() is not null);
create policy "update own company" on companies for update
  using (id = my_company() or my_role() = 'admin');
create policy "admin inserts companies" on companies for insert
  with check (my_role() = 'admin');

-- ---------- SHIPMENTS ----------
create policy "shipper sees own shipments" on shipments for select using (
  shipper_company_id = my_company()
  or my_role() = 'admin'
  or exists (
    select 1 from mission_shipments ms
    join missions m on m.id = ms.mission_id
    where ms.shipment_id = shipments.id and m.carrier_company_id = my_company()
  )
);
create policy "shipper creates shipments" on shipments for insert
  with check (shipper_company_id = my_company() and my_role() = 'shipper');
create policy "shipper updates own draft" on shipments for update
  using (
    (shipper_company_id = my_company() and my_role() = 'shipper')
    or my_role() = 'admin'
  );

-- ---------- SHIPMENT_ITEMS (accès dérivé de l'expédition parente) ----------
create policy "items follow shipment (select)" on shipment_items for select using (
  exists (
    select 1 from shipments s where s.id = shipment_items.shipment_id and (
      s.shipper_company_id = my_company()
      or my_role() = 'admin'
      or exists (
        select 1 from mission_shipments ms
        join missions m on m.id = ms.mission_id
        where ms.shipment_id = s.id and m.carrier_company_id = my_company()
      )
    )
  )
);
create policy "shipper writes items (insert)" on shipment_items for insert with check (
  exists (
    select 1 from shipments s
    where s.id = shipment_items.shipment_id and s.shipper_company_id = my_company()
  )
);
create policy "shipper writes items (update)" on shipment_items for update using (
  exists (
    select 1 from shipments s
    where s.id = shipment_items.shipment_id and s.shipper_company_id = my_company()
  )
);
create policy "shipper writes items (delete)" on shipment_items for delete using (
  exists (
    select 1 from shipments s
    where s.id = shipment_items.shipment_id and s.shipper_company_id = my_company()
  )
);

-- ---------- MISSIONS ----------
-- Le transporteur voit/gère ses missions ; l'expéditeur voit les missions liées à
-- ses expéditions ; l'admin voit tout. La création (assignation) est une action
-- plateforme → réservée à l'admin/rôle service.
create policy "carrier or shipper sees mission" on missions for select using (
  carrier_company_id = my_company()
  or my_role() = 'admin'
  or exists (
    select 1 from mission_shipments ms
    join shipments s on s.id = ms.shipment_id
    where ms.mission_id = missions.id and s.shipper_company_id = my_company()
  )
);
create policy "carrier updates own mission" on missions for update using (
  carrier_company_id = my_company() or my_role() = 'admin'
);
create policy "admin creates mission" on missions for insert
  with check (my_role() = 'admin');

-- ---------- TRACKING_POINTS (accès via la mission) ----------
create policy "tracking visible via mission" on tracking_points for select using (
  exists (
    select 1 from missions m where m.id = tracking_points.mission_id and (
      m.carrier_company_id = my_company()
      or my_role() = 'admin'
      or exists (
        select 1 from mission_shipments ms
        join shipments s on s.id = ms.shipment_id
        where ms.mission_id = m.id and s.shipper_company_id = my_company()
      )
    )
  )
);
create policy "carrier inserts tracking" on tracking_points for insert with check (
  exists (
    select 1 from missions m
    where m.id = tracking_points.mission_id and m.carrier_company_id = my_company()
  )
);

-- ---------- PODS (accès via la mission) ----------
create policy "pod visible via mission" on pods for select using (
  exists (
    select 1 from missions m where m.id = pods.mission_id and (
      m.carrier_company_id = my_company()
      or my_role() = 'admin'
      or exists (
        select 1 from mission_shipments ms
        join shipments s on s.id = ms.shipment_id
        where ms.mission_id = m.id and s.shipper_company_id = my_company()
      )
    )
  )
);
create policy "carrier inserts pod" on pods for insert with check (
  exists (
    select 1 from missions m
    where m.id = pods.mission_id and m.carrier_company_id = my_company()
  )
);

-- NOTE : les tables sans `enable row level security` ci-dessus
-- (carrier_documents, vehicles, drivers, corridors, corridor_rates, departures,
--  mission_shipments, mission_stops, status_events, invoices, payouts, ratings,
--  disputes, messages, notifications, backhaul_offers) restent accessibles à toute
--  clé authentifiée. Activez la RLS + politiques sur celles qui contiennent des
--  données sensibles avant la mise en production.

-- ============================================================
-- 11. DONNÉES DE DÉMARRAGE (corridors nordiques)
-- ============================================================

insert into corridors (code, name, origin_region, dest_region, distance_km, cellular_coverage, requires_satellite, service_days) values
('S-01','Montréal ↔ Gatineau/Outaouais','Montréal','Outaouais',205,'complete',false,'{lundi,mardi,mercredi,jeudi,vendredi}'),
('S-02','Montréal ↔ Abitibi (Val-d''Or/Rouyn)','Montréal','Abitibi',530,'complete',false,'{lundi,mercredi,vendredi}'),
('N-03','Val-d''Or → Matagami/Chibougamau','Abitibi','Nord-du-Québec Sud',230,'partielle',false,'{mardi,jeudi}'),
('N-04','Val-d''Or → Baie-James (Billy-Diamond)','Abitibi','Eeyou Istchee',620,'aucune',true,'{mardi,jeudi}'),
('N-05','Montréal → Côte-Nord (Sept-Îles)','Montréal','Côte-Nord',900,'partielle',true,'{lundi,jeudi}');

insert into corridor_rates (corridor_id, season, effective_from, rate_per_kg, min_charge, fuel_surcharge_pct, season_surcharge_pct, handling_per_pallet, insurance_pct)
select id, 'ete', '2026-06-01', 0.6500, 850, 12, 0, 47.50, 0.5 from corridors where code = 'N-04';
insert into corridor_rates (corridor_id, season, effective_from, rate_per_kg, min_charge, fuel_surcharge_pct, season_surcharge_pct, handling_per_pallet, insurance_pct)
select id, 'hiver', '2026-11-15', 0.7300, 950, 14, 8, 47.50, 0.5 from corridors where code = 'N-04';
insert into corridor_rates (corridor_id, season, effective_from, rate_per_kg, min_charge, fuel_surcharge_pct, season_surcharge_pct, handling_per_pallet, insurance_pct)
select id, 'degel', '2027-03-15', 0.8200, 1050, 14, 15, 47.50, 0.5 from corridors where code = 'N-04';

-- Fin du schéma v1.1
