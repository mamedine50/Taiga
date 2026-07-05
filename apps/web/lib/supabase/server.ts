import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@taiga/types";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Client Supabase pour les Composants Serveur, Server Actions et Route Handlers.
 * Gère la session via les cookies (auth SSR sécurisée).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Appelé depuis un Composant Serveur : l'écriture de cookies y est
            // interdite. Sans danger si un middleware rafraîchit la session.
          }
        },
      },
    },
  );
}
