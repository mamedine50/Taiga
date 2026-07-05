import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@taiga/types";

/** Client Supabase typé sur le schéma Taïga. */
export type TaigaClient = SupabaseClient<Database>;

export interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

/**
 * Crée un client Supabase typé, utilisable côté navigateur ou mobile.
 *
 * Le portail web (Next.js) utilise EN PLUS ses propres helpers SSR basés sur
 * `@supabase/ssr` (gestion des cookies serveur) — voir `apps/web/lib/supabase`.
 * Ce client-ci convient aux contextes purement navigateur/mobile.
 */
export function createTaigaClient(
  { url, anonKey }: SupabaseCredentials,
  options?: Parameters<typeof createClient>[2],
): TaigaClient {
  if (!url || !anonKey) {
    throw new Error(
      "Identifiants Supabase manquants (url / anonKey). Vérifiez vos variables d'environnement.",
    );
  }
  return createClient<Database>(url, anonKey, options);
}

export type { Database } from "@taiga/types";
