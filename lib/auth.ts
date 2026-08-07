import { createClient } from "@/lib/supabase/server";

/**
 * Vérifie si l'utilisateur est authentifié via Supabase Auth.
 * Remplace l'ancien système par mot de passe en env var.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}
