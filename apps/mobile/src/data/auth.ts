// Authentification — isolée dans la couche de données.
// Les écrans utilisent useSession() / signIn / signOut, jamais supabase.auth.
import { supabase } from "./supabase";

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
