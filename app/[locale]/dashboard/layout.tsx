import { setRequestLocale } from "next-intl/server";
import { getUserContext } from "@/lib/supabase/context";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const ctx = await getUserContext(locale);

  // Compte non actif → page d'attente
  if (ctx.companyStatus === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink p-6">
        <div className="max-w-md text-center">
          <img src="/images/velinova-logo.svg" alt="" width={40} height={40} className="mx-auto" />
          <h1 className="mt-6 font-display text-2xl font-semibold text-paper">
            Compte en attente d&apos;activation
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-paper-dim">
            Votre espace Velinova est en cours de préparation. Notre équipe vous
            contactera sous 24h pour finaliser l&apos;activation de votre compte.
          </p>
          <p className="mt-6 text-xs text-paper-dim/60">
            Une question ? Écrivez-nous à{" "}
            <a href="mailto:contact@velinova.xyz" className="text-brass-bright hover:underline">
              contact@velinova.xyz
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (ctx.companyStatus === "suspended") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink p-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-semibold text-paper">
            Accès suspendu
          </h1>
          <p className="mt-4 text-sm text-paper-dim">
            Votre compte a été suspendu. Contactez{" "}
            <a href="mailto:contact@velinova.xyz" className="text-brass-bright hover:underline">
              contact@velinova.xyz
            </a>
            {" "}pour plus d&apos;informations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      <DashboardHeader companyName={ctx.companyName} userName={ctx.userName} />
      <div className="flex">
        <DashboardSidebar locale={locale} />
        <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
