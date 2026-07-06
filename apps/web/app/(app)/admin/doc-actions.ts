"use server";

import { revalidatePath } from "next/cache";
import type { Database } from "@taiga/types";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

type DocStatus = Database["public"]["Enums"]["doc_status"];

export async function reviewDocument(id: string, status: "valide" | "refuse"): Promise<{ error?: string }> {
  const ctx = await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("carrier_documents")
    .update({ status: status as DocStatus, reviewed_by: ctx.userId })
    .eq("id", id);
  if (error) return { error: "generic" };
  revalidatePath("/admin/transporteurs");
  return {};
}

/** URL signée temporaire pour consulter un document (bucket privé). */
export async function getDocSignedUrl(path: string): Promise<{ url?: string; error?: string }> {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("carrier-docs").createSignedUrl(path, 120);
  if (error || !data) return { error: "generic" };
  return { url: data.signedUrl };
}
