import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Créer un compte — Velin",
  robots: { index: false },
};

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SignupForm locale={locale} />;
}
