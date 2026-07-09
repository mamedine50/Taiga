// ⚠️ SEUL fichier de l'app autorisé à importer @supabase.
// Les écrans ne doivent JAMAIS importer ce module ni @supabase directement :
// ils passent par le repository (src/data/index).
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@taiga/types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
