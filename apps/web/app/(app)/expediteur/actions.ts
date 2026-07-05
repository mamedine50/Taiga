"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export type ShipmentItemInput = {
  description: string;
  qty: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKgEach: number;
  stackable: boolean;
  dangerous: boolean;
};

export type ShipmentInput = {
  corridorId: string;
  originAddress: string;
  originCity: string;
  destAddress: string;
  destCity: string;
  requestedDate: string;
  flexible: boolean;
  declaredValue: number | null;
  items: ShipmentItemInput[];
};

export type ShipmentActionState = { error?: "corridor" | "items" | "norate" | "generic" };

/** Crée l'expédition + ses lignes, puis lance la cotation. Redirige vers le détail. */
export async function createShipmentAndQuote(input: ShipmentInput): Promise<ShipmentActionState> {
  const ctx = await requireRole("shipper");
  if (!ctx.company) return { error: "generic" };
  if (!input.corridorId) return { error: "corridor" };
  if (input.items.length === 0) return { error: "items" };

  const supabase = await createClient();

  const { data: shipment, error: insErr } = await supabase
    .from("shipments")
    .insert({
      shipper_company_id: ctx.company.id,
      created_by: ctx.userId,
      corridor_id: input.corridorId,
      origin_address: input.originAddress,
      origin_city: input.originCity,
      dest_address: input.destAddress,
      dest_city: input.destCity,
      requested_date: input.requestedDate,
      flexible: input.flexible,
      declared_value: input.declaredValue,
    })
    .select("id")
    .single();
  if (insErr || !shipment) return { error: "generic" };

  const rows = input.items.map((it) => ({
    shipment_id: shipment.id,
    description: it.description,
    qty: it.qty,
    length_cm: it.lengthCm,
    width_cm: it.widthCm,
    height_cm: it.heightCm,
    weight_kg_each: it.weightKgEach,
    stackable: it.stackable,
    dangerous_goods: it.dangerous,
  }));
  const { error: itemsErr } = await supabase.from("shipment_items").insert(rows);
  if (itemsErr) return { error: "generic" };

  const { error: quoteErr } = await supabase.rpc("quote_shipment", { sid: shipment.id });
  if (quoteErr) {
    return { error: /tarif|rate/i.test(quoteErr.message) ? "norate" : "generic" };
  }

  revalidatePath("/expediteur");
  redirect(`/expediteur/expeditions/${shipment.id}`);
}

export type CustomRouteInput = {
  originCity: string;
  originAddress?: string;
  destCity: string;
  destAddress?: string;
  requestedDate?: string;
  notes?: string;
};

export type CustomRouteState = { error?: "generic"; ok?: boolean };

/** Demande de trajet hors-corridor : capte la demande + notifie l'admin. */
export async function requestCustomRoute(input: CustomRouteInput): Promise<CustomRouteState> {
  await requireRole("shipper");
  const supabase = await createClient();

  const { error } = await supabase.rpc("request_custom_route", {
    p_origin_city: input.originCity,
    p_dest_city: input.destCity,
    p_origin_address: input.originAddress || undefined,
    p_dest_address: input.destAddress || undefined,
    p_requested_date: input.requestedDate || undefined,
    p_notes: input.notes || undefined,
  });
  if (error) return { error: "generic" };
  return { ok: true };
}
