-- ============================================================
-- TAÏGA — Test de bout en bout de la cotation
-- À exécuter dans le SQL Editor APRÈS schema.sql + 002_functions_triggers.sql.
--
-- Scénario : 6 palettes d'équipement (non gerbables), corridor N-04
--            (Val-d'Or → Baie-James), livraison en HIVER (2027-01-15),
--            valeur déclarée 25 000 $.
--
-- IDs fixes pour pouvoir nettoyer facilement ensuite (voir bloc CLEANUP en bas).
-- ============================================================

-- 1) Entreprise expéditrice de test
insert into companies (id, type, legal_name, city)
values ('11111111-1111-1111-1111-111111111111', 'shipper', 'Test Expéditeur Inc.', 'Val-d''Or')
on conflict (id) do nothing;

-- 2) Utilisateur de test → le trigger handle_new_user() crée le profil automatiquement
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated', 'authenticated', 'test-quote@taiga.dev', '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test Expéditeur","role":"shipper","language":"fr"}',
  now(), now()
) on conflict (id) do nothing;

-- 3) Rattacher le profil à l'entreprise
update profiles
  set company_id = '11111111-1111-1111-1111-111111111111'
  where id = '22222222-2222-2222-2222-222222222222';

-- 4) Expédition (corridor N-04, date hiver → sélectionne le tarif hiver automatiquement)
insert into shipments (
  id, shipper_company_id, created_by,
  origin_address, origin_city, dest_address, dest_city,
  corridor_id, requested_date, declared_value
) values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '123 rue de la Mine', 'Val-d''Or',
  'Chantier Baie-James Est', 'Eeyou Istchee',
  (select id from corridors where code = 'N-04'),
  '2027-01-15',
  25000
) on conflict (id) do nothing;

-- 5) 6 palettes non gerbables (le trigger recalcule poids/CBM/pi linéaires/poids facturable)
insert into shipment_items (shipment_id, description, qty, length_cm, width_cm, height_cm, weight_kg_each, stackable)
values ('33333333-3333-3333-3333-333333333333', 'Équipement minier', 6, 120, 100, 110, 300, false);

-- 6) Vérifier les totaux calculés par le trigger de l'étape 1
select ref, total_weight_kg, total_cbm, total_linear_ft, chargeable_weight_kg
from shipments where id = '33333333-3333-3333-3333-333333333333';

-- 7) COTATION → affiche le devis détaillé (et écrit subtotal/gst/qst/total dans le shipment)
select jsonb_pretty(public.quote_shipment('33333333-3333-3333-3333-333333333333'));


-- ============================================================
-- CLEANUP — décommentez et exécutez pour tout supprimer après le test
-- ============================================================
-- delete from shipments where id = '33333333-3333-3333-3333-333333333333';   -- cascade → items
-- delete from companies where id = '11111111-1111-1111-1111-111111111111';
-- delete from auth.users where id = '22222222-2222-2222-2222-222222222222';  -- cascade → profile
