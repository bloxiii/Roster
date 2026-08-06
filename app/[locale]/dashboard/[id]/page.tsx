import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { ProspectDetail } from "@/components/dashboard/ProspectDetail";
import { readProspects } from "@/lib/agent/save-prospect";

export const metadata: Metadata = {
  title: "Prospect — Dashboard Velin",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

async function getProspect(id: string) {
  const prospects = await readProspects();
  return prospects.find((p) => p.id === id) ?? null;
}

export default async function ProspectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const authed = await isAuthenticated();
  if (!authed) {
    return <LoginForm />;
  }

  const prospect = await getProspect(id);
  if (!prospect) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-border/60 bg-ink/85 backdrop-blur-md">
        <Container className="flex h-14 items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold tracking-tight text-paper">
              Velin
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-brass">
              Dashboard
            </span>
          </div>
        </Container>
      </header>

      <Container className="py-10">
        <ProspectDetail prospect={prospect} locale={locale} />
      </Container>
    </div>
  );
}
