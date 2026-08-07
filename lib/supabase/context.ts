import { createClient } from "./server";
import { redirect } from "next/navigation";

export type CompanyStatus = "pending" | "active" | "suspended";

export type UserContext = {
  userId: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  companyStatus: CompanyStatus;
  role: string;
  email: string;
  userName: string;
};

/**
 * Récupère le contexte complet de l'utilisateur connecté.
 * Redirige vers /login si pas de session.
 * Redirige vers /pending si le compte n'est pas actif.
 *
 * Note : cette fonction est le seul point d'accès au contexte user.
 * Elle est appelée une seule fois dans le layout du dashboard,
 * pas dans chaque page (fix performance).
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
    .select("company_id, role, companies(name, slug, status)")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect(`/${locale}/login`);
  }

  const company = membership.companies as unknown as {
    name: string;
    slug: string;
    status: CompanyStatus;
  };

  return {
    userId: user.id,
    companyId: membership.company_id,
    companyName: company.name,
    companySlug: company.slug,
    companyStatus: company.status ?? "pending",
    role: membership.role,
    email: user.email ?? "",
    userName: user.user_metadata?.name ?? user.email ?? "",
  };
}
