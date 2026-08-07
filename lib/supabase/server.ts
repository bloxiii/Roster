import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pour les Server Components, Server Actions et Route Handlers.
 * Lit et écrit les cookies de session via next/headers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component en lecture seule — ignoré.
            // Le middleware se chargera de rafraîchir la session.
          }
        },
      },
    },
  );
}

/**
 * Client Supabase admin (service role) pour les opérations internes
 * qui ne dépendent pas d'une session utilisateur (ex: sauvegarde prospect
 * depuis le widget public).
 */
export function createServiceClient() {
  const { createClient: createSupa } = require("@supabase/supabase-js");
  return createSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
