"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export type MissionActionState = { error?: "selection" | "expired" | "generic"; ok?: boolean };

export async function acceptMission(
  missionId: string,
  driverId?: string,
  vehicleId?: string,
): Promise<MissionActionState> {
  await requireRole("carrier");
  const supabase = await createClient();

  const { error } = await supabase.rpc("accept_mission", {
    p_mission: missionId,
    p_driver: driverId || undefined,
    p_vehicle: vehicleId || undefined,
  });

  if (error) {
    if (/[Ss]élection|selection|requise/.test(error.message)) return { error: "selection" };
    if (/expir/i.test(error.message)) return { error: "expired" };
    return { error: "generic" };
  }

  revalidatePath("/transporteur");
  return { ok: true };
}

export async function refuseMission(missionId: string): Promise<MissionActionState> {
  await requireRole("carrier");
  const supabase = await createClient();
  const { error } = await supabase.rpc("refuse_mission", { p_mission: missionId });
  if (error) return { error: "generic" };
  revalidatePath("/transporteur");
  return { ok: true };
}
