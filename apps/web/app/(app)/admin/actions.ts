"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export type AssignInput = {
  shipmentId: string;
  carrierId: string;
  carrierPayout: number;
  expiresHours: number;
};

export type AssignState = { error?: string; ok?: boolean };

export async function assignMission(input: AssignInput): Promise<AssignState> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: ship } = await supabase
    .from("shipments")
    .select("subtotal")
    .eq("id", input.shipmentId)
    .single();
  const subtotal = ship?.subtotal ?? 0;

  if (input.carrierPayout < 0 || input.carrierPayout > subtotal) {
    return { error: "payout" };
  }
  const platformFee = Math.round((subtotal - input.carrierPayout) * 100) / 100;

  const { error } = await supabase.rpc("assign_shipment_to_carrier", {
    p_shipment: input.shipmentId,
    p_carrier: input.carrierId,
    p_carrier_payout: input.carrierPayout,
    p_platform_fee: platformFee,
    p_expires_hours: Math.max(1, Math.round(input.expiresHours)),
  });
  if (error) return { error: "generic" };

  revalidatePath("/admin");
  return { ok: true };
}

export async function verifyCarrier(companyId: string, verified: boolean): Promise<void> {
  await requireRole("admin");
  const supabase = await createClient();
  await supabase.from("companies").update({ verified }).eq("id", companyId);
  revalidatePath("/admin");
}
