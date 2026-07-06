"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export type CreateDepartureInput = {
  corridorId: string;
  date: string;
  terminal: string;
  capKg: number;
  capCbm: number;
  capLf: number;
};

export async function createDeparture(input: CreateDepartureInput): Promise<{ error?: string }> {
  await requireRole("admin");
  if (!input.corridorId || !input.date || !input.terminal.trim()) return { error: "generic" };

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("create_departure", {
    p_corridor: input.corridorId,
    p_date: input.date,
    p_terminal: input.terminal.trim(),
    p_cap_kg: input.capKg,
    p_cap_cbm: input.capCbm,
    p_cap_lf: input.capLf,
  });
  if (error || !id) return { error: "generic" };

  redirect(`/admin/departs/${id}`);
}

export async function addShipmentToDeparture(
  departureId: string,
  shipmentId: string,
): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_shipment_to_departure", {
    p_departure: departureId,
    p_shipment: shipmentId,
  });
  if (error) return { error: "generic" };
  revalidatePath(`/admin/departs/${departureId}`);
  return {};
}

export async function removeShipmentFromDeparture(
  departureId: string,
  shipmentId: string,
): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_shipment_from_departure", {
    p_shipment: shipmentId,
  });
  if (error) return { error: "generic" };
  revalidatePath(`/admin/departs/${departureId}`);
  return {};
}

export type ConfideInput = {
  departureId: string;
  carrierId: string;
  carrierPayout: number;
  expiresHours: number;
};

export async function confideDeparture(input: ConfideInput): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: ships } = await supabase
    .from("shipments")
    .select("subtotal")
    .eq("departure_id", input.departureId)
    .eq("status", "cote");
  const sum = (ships ?? []).reduce((acc, s) => acc + (s.subtotal ?? 0), 0);

  if (input.carrierPayout < 0 || input.carrierPayout > sum) return { error: "payout" };
  const fee = Math.round((sum - input.carrierPayout) * 100) / 100;

  const { error } = await supabase.rpc("assign_departure_to_carrier", {
    p_departure: input.departureId,
    p_carrier: input.carrierId,
    p_carrier_payout: input.carrierPayout,
    p_platform_fee: fee,
    p_expires_hours: Math.max(1, Math.round(input.expiresHours)),
  });
  if (error) return { error: "generic" };

  redirect("/admin/departs");
}
