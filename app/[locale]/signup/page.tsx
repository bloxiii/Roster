import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

/**
 * Le signup public est désactivé.
 * Les comptes sont créés par l'équipe Velin après vente.
 * Redirige vers la page d'accueil.
 */
export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}`);
}
