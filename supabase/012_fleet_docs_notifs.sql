-- ============================================================
-- TAÏGA — Onboarding flotte : RLS documents + notifications
-- À exécuter APRÈS 011, dans le SQL Editor.
--
-- (drivers / vehicles ont déjà leurs politiques via 009.)
-- Ici : carrier_documents (téléversement + validation admin) et
-- notifications (cloche : lire les siennes, marquer comme lu).
-- Aucune nouvelle fonction → les types générés ne changent pas.
-- ============================================================

-- ---------- carrier_documents ----------
alter table carrier_documents enable row level security;

drop policy if exists "docs: read own or admin" on carrier_documents;
create policy "docs: read own or admin" on carrier_documents for select
  using (company_id = my_company() or my_role() = 'admin');

drop policy if exists "docs: carrier insert own" on carrier_documents;
create policy "docs: carrier insert own" on carrier_documents for insert
  with check (company_id = my_company());

drop policy if exists "docs: carrier delete own" on carrier_documents;
create policy "docs: carrier delete own" on carrier_documents for delete
  using (company_id = my_company());

-- Le transporteur peut réviser les siens (ré-upload) ; l'admin valide (statut).
drop policy if exists "docs: update own or admin" on carrier_documents;
create policy "docs: update own or admin" on carrier_documents for update
  using (company_id = my_company() or my_role() = 'admin');

-- ---------- notifications ----------
alter table notifications enable row level security;

drop policy if exists "notifs: read own" on notifications;
create policy "notifs: read own" on notifications for select
  using (profile_id = auth.uid());

drop policy if exists "notifs: update own" on notifications;
create policy "notifs: update own" on notifications for update
  using (profile_id = auth.uid());

-- (l'insertion se fait via des fonctions security definer / rôle service)

-- Fin migration 012
