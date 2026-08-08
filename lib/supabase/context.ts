import { createClient } from "./server";
import { redirect } from "next/navigation";
import { cache } from "react";

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
 * Récupère le contexte utilisateur — CACHED par requête.
 * Grâce à React.cache(), même si appelé 5 fois dans un même rendu
 * (layout + page + composants), la requête Supabase n'est faite qu'UNE fois.
 */
export const getUserContext = cache(async (locale: string = "fr"): Promise<UserContext> => {
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
});

/**
 * Crée un client Supabase avec la session déjà chargée.
 * Utilise le cache pour éviter de re-créer le client à chaque page.
 */
export const getAuthenticatedClient = cache(async () => {
  const supabase = await createClient();
  await supabase.auth.getUser();
  return supabase;
});
