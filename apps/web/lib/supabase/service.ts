import { createClient } from "@supabase/supabase-js";
import type { Database } from "@taiga/types";

/**
 * Client Supabase avec la clé SERVICE (contourne la RLS).
 * Serveur UNIQUEMENT — webhook Stripe, facturation. Jamais côté navigateur.
 */
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
