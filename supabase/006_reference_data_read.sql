-- ============================================================
-- TAÏGA — Correctif : lecture des données de référence
-- À exécuter APRÈS 005_route_requests.sql, dans le SQL Editor.
--
-- Constat : via l'app (rôles anon/authenticated), `corridors` et
-- `corridor_rates` renvoyaient 0 ligne (RLS active sans politique de lecture),
-- alors que le service role voit tout. Résultat : menu de corridors vide et
-- échec de quote_shipment() (qui lit corridor_rates en tant qu'appelant).
--
-- Ce sont des DONNÉES DE RÉFÉRENCE : on les rend lisibles par tous.
-- ============================================================

grant select on corridors to anon, authenticated;
grant select on corridor_rates to anon, authenticated;

alter table corridors enable row level security;
drop policy if exists "read corridors" on corridors;
create policy "read corridors" on corridors for select using (true);

alter table corridor_rates enable row level security;
drop policy if exists "read corridor rates" on corridor_rates;
create policy "read corridor rates" on corridor_rates for select using (true);

-- Fin correctif 006
