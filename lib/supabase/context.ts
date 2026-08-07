import { createClient } from "./server";
import { redirect } from "next/navigation";

export type UserContext = {
  userId: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  role: string;
  email: string;
  userName: string;
};

/**
 * Récupère le contexte complet de l'utilisateur connecté.
 * Redirige vers /login si pas de session.
 * Utilisé dans tous les server components du dashboard.
 */
export async function getUserContext(locale: string = "fr"): Promise<UserContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("company_id, role, companies(name, slug)")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect(`/${locale}/login`);
  }

  const company = membership.companies as unknown as { name: string; slug: string };

  return {
    userId: user.id,
    companyId: membership.company_id,
    companyName: company.name,
    companySlug: company.slug,
    role: membership.role,
    email: user.email ?? "",
    userName: user.user_metadata?.name ?? user.email ?? "",
  };
}
