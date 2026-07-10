import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { generateInvoicePdf } from "@/lib/invoice";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  // Autorisation réussie (capture différée) → réservation + facture.
  if (event.type === "payment_intent.amount_capturable_updated") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const shipmentId = pi.metadata?.shipment_id;
    if (shipmentId) {
      const supabase = createServiceClient();
      const { data: s } = await supabase
        .from("shipments")
        .select("payment_status, ref, subtotal, gst, qst, total_amount, origin_city, dest_city")
        .eq("id", shipmentId)
        .single();

      // Idempotent : ne facture/réserve qu'une fois.
      if (s && s.payment_status !== "retenu") {
        const { data: number } = await supabase.rpc("next_invoice_number");
        const invoiceNumber = number ?? `INV-${Date.now()}`;

        const pdf = await generateInvoicePdf({
          number: invoiceNumber,
          ref: s.ref,
          originCity: s.origin_city,
          destCity: s.dest_city,
          subtotal: s.subtotal,
          gst: s.gst,
          qst: s.qst,
          total: s.total_amount,
          dateISO: new Date().toISOString(),
        });
        const pdfPath = `${shipmentId}/${invoiceNumber}.pdf`;
        await supabase.storage.from("invoices").upload(pdfPath, pdf, {
          contentType: "application/pdf",
          upsert: true,
        });

        await supabase.rpc("confirm_reservation", {
          p_shipment: shipmentId,
          p_payment_intent: pi.id,
          p_number: invoiceNumber,
          p_pdf_path: pdfPath,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
