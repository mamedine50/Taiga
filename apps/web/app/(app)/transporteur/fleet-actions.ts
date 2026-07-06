"use server";

import { revalidatePath } from "next/cache";
import type { Database } from "@taiga/types";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

type VehicleType = Database["public"]["Enums"]["vehicle_type"];
type Telematics = Database["public"]["Enums"]["telematics_type"];
type DocType = Database["public"]["Enums"]["doc_type"];

export type Result = { error?: string };

// ---------- Chauffeurs ----------
export async function addDriver(input: {
  licenseNumber: string;
  licenseClass: string;
}): Promise<Result> {
  const ctx = await requireRole("carrier");
  if (!ctx.company) return { error: "generic" };
  const supabase = await createClient();
  const { error } = await supabase.from("drivers").insert({
    company_id: ctx.company.id,
    license_number: input.licenseNumber.trim() || null,
    license_class: input.licenseClass.trim() || "1",
    active: true,
  });
  if (error) return { error: "generic" };
  revalidatePath("/transporteur/flotte");
  return {};
}

export async function toggleDriver(id: string, active: boolean): Promise<Result> {
  const ctx = await requireRole("carrier");
  const supabase = await createClient();
  const { error } = await supabase
    .from("drivers")
    .update({ active })
    .eq("id", id)
    .eq("company_id", ctx.company?.id ?? "");
  if (error) return { error: "generic" };
  revalidatePath("/transporteur/flotte");
  return {};
}

// ---------- Véhicules ----------
export async function addVehicle(input: {
  unitNumber: string;
  type: string;
  capacityKg: number;
  capacityCbm: number;
  linearFeet: number;
  telematics: string;
}): Promise<Result> {
  const ctx = await requireRole("carrier");
  if (!ctx.company) return { error: "generic" };
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").insert({
    company_id: ctx.company.id,
    unit_number: input.unitNumber.trim(),
    type: input.type as VehicleType,
    capacity_kg: input.capacityKg,
    capacity_cbm: input.capacityCbm,
    linear_feet: input.linearFeet,
    telematics: input.telematics as Telematics,
    active: true,
  });
  if (error) return { error: "generic" };
  revalidatePath("/transporteur/flotte");
  return {};
}

export async function toggleVehicle(id: string, active: boolean): Promise<Result> {
  const ctx = await requireRole("carrier");
  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ active })
    .eq("id", id)
    .eq("company_id", ctx.company?.id ?? "");
  if (error) return { error: "generic" };
  revalidatePath("/transporteur/flotte");
  return {};
}

// ---------- Raccourci artisan (propriétaire-exploitant) ----------
export async function ownerOperatorSetup(input: {
  licenseNumber: string;
  licenseClass: string;
  unitNumber: string;
  type: string;
  capacityKg: number;
  capacityCbm: number;
  linearFeet: number;
  telematics: string;
}): Promise<Result> {
  const ctx = await requireRole("carrier");
  if (!ctx.company) return { error: "generic" };
  const supabase = await createClient();

  const { error: dErr } = await supabase.from("drivers").insert({
    company_id: ctx.company.id,
    profile_id: ctx.userId,
    license_number: input.licenseNumber.trim() || null,
    license_class: input.licenseClass.trim() || "1",
    active: true,
  });
  if (dErr) return { error: "generic" };

  const { error: vErr } = await supabase.from("vehicles").insert({
    company_id: ctx.company.id,
    unit_number: input.unitNumber.trim(),
    type: input.type as VehicleType,
    capacity_kg: input.capacityKg,
    capacity_cbm: input.capacityCbm,
    linear_feet: input.linearFeet,
    telematics: input.telematics as Telematics,
    active: true,
  });
  if (vErr) return { error: "generic" };

  revalidatePath("/transporteur/flotte");
  return {};
}

// ---------- Documents ----------
export async function uploadDocument(formData: FormData): Promise<void> {
  const ctx = await requireRole("carrier");
  if (!ctx.company) return;
  const file = formData.get("file") as File | null;
  const type = String(formData.get("type") ?? "");
  const expiresAt = String(formData.get("expiresAt") ?? "").trim() || null;
  if (!file || file.size === 0 || !type) return;

  const supabase = await createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "pdf";
  const path = `${ctx.company.id}/${type}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage.from("carrier-docs").upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (upErr) return;

  await supabase.from("carrier_documents").insert({
    company_id: ctx.company.id,
    type: type as DocType,
    file_url: path,
    expires_at: expiresAt,
    status: "en_attente",
  });

  revalidatePath("/transporteur/documents");
}

export async function deleteDocument(id: string, path: string): Promise<Result> {
  const ctx = await requireRole("carrier");
  const supabase = await createClient();
  await supabase.storage.from("carrier-docs").remove([path]);
  const { error } = await supabase
    .from("carrier_documents")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company?.id ?? "");
  if (error) return { error: "generic" };
  revalidatePath("/transporteur/documents");
  return {};
}
