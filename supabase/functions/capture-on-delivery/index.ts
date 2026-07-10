// TAÏGA — Capture des fonds à la livraison (déclenchée par un webhook DB).
//
// Déclencheur : Database Webhook sur `shipments` (UPDATE) → cette fonction.
// On ne capture QUE la transition vers `livre`, de façon IDEMPOTENTE :
//   - on récupère l'état du PaymentIntent AVANT de capturer,
//   - si déjà `succeeded` → on n'appelle pas capture deux fois,
//   - chaque tentative est journalisée (logs de la fonction),
//   - en cas d'échec → payment_status = 'echoue' + notification admin
//     (jamais d'échec silencieux).
//
// Secrets requis : STRIPE_SECRET_KEY (via `supabase secrets set`).
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function stripeReq(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, string>,
): Promise<{ ok: boolean; data: any }> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? new URLSearchParams(body) : undefined,
  });
  return { ok: res.ok, data: await res.json() };
}

Deno.serve(async (req) => {
  const payload = await req.json().catch(() => ({}));
  const record = payload.record ?? {};
  const old = payload.old_record ?? {};

  // Uniquement la transition vers « livré ».
  if (record.status !== "livre" || old.status === "livre") {
    return new Response(JSON.stringify({ skipped: "not a delivery transition" }), { status: 200 });
  }

  const shipmentId: string = record.id;
  const pi: string | null = record.stripe_payment_intent_id;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  if (!pi || record.payment_status !== "retenu") {
    console.log(`[capture] skip ${shipmentId} — pi=${pi} payment_status=${record.payment_status}`);
    return new Response(JSON.stringify({ skipped: "nothing to capture" }), { status: 200 });
  }

  try {
    // Idempotence : lire l'état AVANT de capturer.
    const retr = await stripeReq(`payment_intents/${pi}`, "GET");
    if (!retr.ok) throw new Error(retr.data?.error?.message ?? "retrieve failed");
    const status: string = retr.data.status;
    console.log(`[capture] attempt ${shipmentId} — PI ${pi} status=${status}`);

    if (status === "succeeded") {
      await supabase.rpc("mark_captured", { p_shipment: shipmentId });
      console.log(`[capture] already captured ${shipmentId}`);
      return new Response(JSON.stringify({ already: true }), { status: 200 });
    }
    if (status !== "requires_capture") {
      throw new Error(`PaymentIntent non capturable (status=${status})`);
    }

    const cap = await stripeReq(`payment_intents/${pi}/capture`, "POST");
    if (!cap.ok || cap.data?.status !== "succeeded") {
      throw new Error(cap.data?.error?.message ?? `capture status=${cap.data?.status}`);
    }

    await supabase.rpc("mark_captured", { p_shipment: shipmentId });
    console.log(`[capture] OK ${shipmentId} — PI ${pi}`);
    return new Response(JSON.stringify({ captured: true }), { status: 200 });
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.error(`[capture] FAILED ${shipmentId} — ${reason}`);
    await supabase.rpc("mark_capture_failed", { p_shipment: shipmentId, p_reason: reason });
    // 200 volontaire : l'échec est enregistré + notifié, on évite une boucle de retries.
    return new Response(JSON.stringify({ error: reason }), { status: 200 });
  }
});
