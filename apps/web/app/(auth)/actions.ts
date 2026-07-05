"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dashboardPath } from "@/lib/auth";
import type { UserRole } from "@taiga/core";

export type AuthState = { error?: "invalid" | "generic" | "emailInUse" };

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/** Connexion : vérifie les identifiants et redirige selon le rôle. */
export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = str(formData, "email");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "invalid" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: UserRole = "shipper";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile) role = profile.role;
  }

  redirect(dashboardPath(role));
}

/**
 * Inscription combinée : crée le compte (le trigger SQL crée le profil),
 * puis crée l'entreprise et relie le profil via la fonction sécurisée.
 * Auto-confirm activé → session immédiate.
 */
export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = str(formData, "email");
  const password = String(formData.get("password") ?? "");
  const fullName = str(formData, "fullName");
  const roleInput = str(formData, "role");
  const companyName = str(formData, "companyName");
  const neq = str(formData, "neq") || undefined;
  const city = str(formData, "city") || undefined;
  const phone = str(formData, "phone") || undefined;
  const language = str(formData, "language") === "en" ? "en" : "fr";

  if (roleInput !== "shipper" && roleInput !== "carrier") return { error: "generic" };
  const role: UserRole = roleInput;

  const supabase = await createClient();
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role, language } },
  });
  if (signUpError) {
    return { error: /already|exist/i.test(signUpError.message) ? "emailInUse" : "generic" };
  }

  const { error: rpcError } = await supabase.rpc("create_company_and_link", {
    p_legal_name: companyName,
    p_neq: neq,
    p_city: city,
    p_phone: phone,
    p_language: language,
  });
  if (rpcError) return { error: "generic" };

  redirect(dashboardPath(role));
}
