"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getStripe, toCents } from "@/lib/stripe";

/**
 * Crée (ou réutilise) un PaymentIntent en capture DIFFÉRÉE pour réserver.
 * L'autorisation retient les fonds ; la capture réelle se fera à la livraison.
 */
export async function createReservationIntent(
  shipmentId: string,
): Promise<{ clientSecret: string | null; error?: string }> {
  const ctx = await requireRole("shipper");
  const supabase = await createClient();

  const { data: s } = await supabase
    .from("shipments")
    .select("id, status, total_amount, currency, stripe_payment_intent_id, shipper_company_id")
    .eq("id", shipmentId)
    .single();

  if (!s || s.shipper_company_id !== ctx.company?.id) return { clientSecret: null, error: "not_found" };
  if (!s.total_amount || s.total_amount <= 0) return { clientSecret: null, error: "no_amount" };
  if (s.status !== "cote") return { clientSecret: null, error: "not_quotable" };

  // Réutilise un PaymentIntent encore confirmable (évite les doublons).
  if (s.stripe_payment_intent_id) {
    try {
      const existing = await getStripe().paymentIntents.retrieve(s.stripe_payment_intent_id);
      if (
        ["requires_payment_method", "requires_confirmation", "requires_action"].includes(existing.status) &&
        existing.client_secret
      ) {
        return { clientSecret: existing.client_secret };
      }
    } catch {
      // introuvable → on en crée un nouveau
    }
  }

  const pi = await getStripe().paymentIntents.create({
    amount: toCents(s.total_amount),
    currency: (s.currency ?? "cad").toLowerCase(),
    capture_method: "manual",
    metadata: { shipment_id: s.id },
    description: `Taïga — réservation expédition`,
  });

  await supabase.from("shipments").update({ stripe_payment_intent_id: pi.id }).eq("id", s.id);
  return { clientSecret: pi.client_secret };
}
