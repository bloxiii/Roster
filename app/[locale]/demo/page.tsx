import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ChatWidget } from "@/components/agent/ChatWidget";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "Démo — Velin",
  robots: { index: false },
};

/**
 * Page de démo protégée par un token.
 * Accessible uniquement via /demo?token=DEMO_SECRET
 * Utilisée par l'équipe Velin pour les démonstrations clients.
 */
export default async function DemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { token } = await searchParams;
  const demoToken = process.env.DEMO_TOKEN;

  // Si DEMO_TOKEN est configuré, vérifier le token dans l'URL
  if (demoToken && token !== demoToken) {
    redirect(`/${locale}`);
  }

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-border/60 bg-ink/85 backdrop-blur-md">
        <Container className="flex h-14 items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/images/velin-logo.svg" alt="" width={24} height={24} />
            <span className="font-display text-base font-semibold text-paper">Velin</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-brass">Demo</span>
          </Link>
          <StatusBadge label="Agent actif" />
        </Container>
      </header>

      <Container className="py-10">
        <div className="mx-auto max-w-3xl">
          <Eyebrow>Agent #001 · Qualification commerciale</Eyebrow>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
            Votre employé numérique en action
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper-dim">
            Cet agent accueille vos prospects, comprend leur projet immobilier,
            qualifie leur niveau d&apos;intérêt et génère une fiche exploitable pour
            vos commerciaux — 24 heures sur 24, 7 jours sur 7.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-ink-soft" style={{ height: "600px" }}>
            <ChatWidget />
          </div>
        </div>
      </Container>
    </div>
  );
}
