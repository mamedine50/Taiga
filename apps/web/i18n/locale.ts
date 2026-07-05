"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, type Locale } from "@taiga/i18n";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE } from "./config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Change la langue : mémorise le choix dans un cookie et, si l'utilisateur est
 * connecté, le sauvegarde sur son profil (pour que notifications et courriels
 * partent dans la bonne langue).
 */
export async function setLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ language: locale }).eq("id", user.id);
  }

  revalidatePath("/", "layout");
}
