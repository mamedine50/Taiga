-- ============================================================
-- TAÏGA — Seed : tarifs des corridors restants (S-01, S-02, N-03, N-05)
-- À exécuter APRÈS 007. (Déjà appliqué via la clé service pendant le dev ;
-- ce fichier garde la trace et reste idempotent grâce au ON CONFLICT.)
--
-- Le seed initial ne couvrait que N-04 → la cotation échouait sur les autres.
-- Tarifs saisonniers (été/hiver/dégel) mis à l'échelle selon la distance.
-- ============================================================

insert into corridor_rates
  (corridor_id, season, effective_from, rate_per_kg, min_charge,
   fuel_surcharge_pct, season_surcharge_pct, handling_per_pallet, insurance_pct)
select c.id, v.season::season, v.eff::date, v.rate, v.minc, v.fuel, v.seas, 47.50, 0.5
from (values
  -- S-01 Montréal ↔ Gatineau/Outaouais (205 km)
  ('S-01','ete',  '2026-01-01', 0.2800,  350, 12,  0),
  ('S-01','hiver','2026-11-15', 0.3100,  400, 14,  6),
  ('S-01','degel','2027-03-15', 0.3400,  450, 14, 12),
  -- S-02 Montréal ↔ Abitibi (530 km)
  ('S-02','ete',  '2026-01-01', 0.4200,  550, 12,  0),
  ('S-02','hiver','2026-11-15', 0.4700,  620, 14,  6),
  ('S-02','degel','2027-03-15', 0.5200,  690, 14, 12),
  -- N-03 Val-d'Or → Matagami/Chibougamau (230 km, couverture partielle)
  ('N-03','ete',  '2026-01-01', 0.4800,  600, 13,  0),
  ('N-03','hiver','2026-11-15', 0.5400,  680, 14,  8),
  ('N-03','degel','2027-03-15', 0.6000,  760, 14, 13),
  -- N-05 Montréal → Côte-Nord/Sept-Îles (900 km, satellite)
  ('N-05','ete',  '2026-01-01', 0.7000, 1100, 14,  0),
  ('N-05','hiver','2026-11-15', 0.7800, 1250, 15, 10),
  ('N-05','degel','2027-03-15', 0.8600, 1400, 15, 16)
) as v(code, season, eff, rate, minc, fuel, seas)
join corridors c on c.code = v.code
on conflict (corridor_id, season, effective_from) do nothing;

-- Fin seed 008
