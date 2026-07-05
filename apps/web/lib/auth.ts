import { redirect } from "next/navigation";
import type { UserRole } from "@taiga/core";
import { createClient } from "@/lib/supabase/server";

export type Company = {
  id: string;
  legalName: string;
  type: "shipper" | "carrier";
  verified: boolean;
};

export type UserContext = {
  userId: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  language: "fr" | "en";
  company: Company | null;
};

/** Chemin du tableau de bord correspondant au rôle. */
export function dashboardPath(role: UserRole): string {
  switch (role) {
    case "shipper":
      return "/expediteur";
    case "carrier":
      return "/transporteur";
    case "admin":
      return "/admin";
    case "driver":
      return "/chauffeur";
  }
}

/** Contexte de l'utilisateur courant (profil + entreprise), ou null si non connecté. */
export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, language, company_id")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  let company: Company | null = null;
  if (profile.company_id) {
    const { data: c } = await supabase
      .from("companies")
      .select("id, legal_name, type, verified")
      .eq("id", profile.company_id)
      .single();
    if (c) {
      company = {
        id: c.id,
        legalName: c.legal_name,
        type: c.type,
        verified: c.verified ?? false,
      };
    }
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile.full_name,
    role: profile.role,
    language: profile.language === "en" ? "en" : "fr",
    company,
  };
}

/** Exige une session ; redirige vers /connexion sinon. */
export async function requireUser(): Promise<UserContext> {
  const ctx = await getUserContext();
  if (!ctx) redirect("/connexion");
  return ctx;
}

/** Exige un rôle précis ; redirige vers le bon tableau de bord sinon. */
export async function requireRole(role: UserRole): Promise<UserContext> {
  const ctx = await requireUser();
  if (ctx.role !== role) redirect(dashboardPath(ctx.role));
  return ctx;
}
