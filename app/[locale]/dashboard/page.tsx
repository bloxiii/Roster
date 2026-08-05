import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { isAuthenticated } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { ProspectList } from "@/components/dashboard/ProspectList";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import type { ProspectRecord } from "@/lib/agent/types";
import { readFile } from "fs/promises";
import { join } from "path";

export const metadata: Metadata = {
  title: "Dashboard — Roster",
  robots: { index: false },
};

// Force le rendu dynamique (les données changent à chaque requête)
export const dynamic = "force-dynamic";

async function getProspects(): Promise<ProspectRecord[]> {
  try {
    const raw = await readFile(join("/tmp", "roster-data", "prospects.json"), "utf-8");
    return (JSON.parse(raw) as ProspectRecord[]).reverse();
  } catch {
    return [];
  }
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const authed = await isAuthenticated();
  if (!authed) {
    return <LoginForm />;
  }

  const prospects = await getProspects();
  const { q } = await searchParams;
  const activeFilter = q && ["HOT", "WARM", "COLD"].includes(q) ? q : null;

  // Stats rapides
  const total = prospects.length;
  const hot = prospects.filter((p) => p.data.qualification === "HOT").length;
  const warm = prospects.filter((p) => p.data.qualification === "WARM").length;

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-border/60 bg-ink/85 backdrop-blur-md">
        <Container className="flex h-14 items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold tracking-tight text-paper">
              Roster
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-brass">
              Dashboard
            </span>
          </div>
          <LogoutButton />
        </Container>
      </header>

      <Container className="py-10">
        <Eyebrow>Prospects</Eyebrow>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper">
          Tableau de bord commercial
        </h1>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/60">
              Total
            </span>
            <p className="mt-1 font-display text-2xl font-semibold text-paper">{total}</p>
          </div>
          <div className="rounded-xl border border-status/30 bg-status/5 p-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-status/60">
              Hot
            </span>
            <p className="mt-1 font-display text-2xl font-semibold text-status">{hot}</p>
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400/60">
              Warm
            </span>
            <p className="mt-1 font-display text-2xl font-semibold text-amber-400">{warm}</p>
          </div>
        </div>

        {/* Liste */}
        <div className="mt-8">
          <ProspectList prospects={prospects} activeFilter={activeFilter} locale={locale} />
        </div>
      </Container>
    </div>
  );
}
