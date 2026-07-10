-- ============================================================
-- TAÏGA — Webhook DB : capture des fonds à la livraison
-- À exécuter APRÈS 016, dans le SQL Editor.
--
-- À chaque passage d'une expédition à « livré », on appelle l'Edge Function
-- capture-on-delivery (via pg_net). La fonction capture le PaymentIntent de
-- façon idempotente et gère les échecs (payment_status 'echoue' + notif admin).
-- La clé utilisée ici est la clé ANON (publique) — juste pour router l'appel.
-- ============================================================

create extension if not exists pg_net;

create or replace function public.trigger_capture_on_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'livre' and (old.status is distinct from new.status) then
    perform net.http_post(
      url := 'https://cqalgxkxlxpwpmuzwhyj.supabase.co/functions/v1/capture-on-delivery',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxYWxneGt4bHhwd3BtdXp3aHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMTUwNzMsImV4cCI6MjA5ODc5MTA3M30.bOfNwMeqqHValrZW8mS2I2M-rknlkhRoLCXKylhDU-o'
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'shipments',
        'record', to_jsonb(new),
        'old_record', to_jsonb(old)
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_capture_on_delivery on shipments;
create trigger trg_capture_on_delivery
  after update on shipments
  for each row execute function public.trigger_capture_on_delivery();

-- Fin migration 017
