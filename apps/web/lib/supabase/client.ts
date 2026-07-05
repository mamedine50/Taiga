import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@taiga/types";

/** Client Supabase pour les Composants Client (navigateur). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
