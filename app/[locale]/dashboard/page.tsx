import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getUserContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ProspectList } from "@/components/dashboard/ProspectList";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export const metadata: Metadata = {
  title: "Dashboard — Velin",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const ctx = await getUserContext(locale);
  const supabase = await createClient();

  // Récupérer les prospects de cette company (RLS appliqué automatiquement)
  const { data: prospects } = await supabase
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false });

  const allProspects = prospects ?? [];
  const { q } = await searchParams;
  const activeFilter = q && ["HOT", "WARM", "COLD"].includes(q) ? q : null;

  const total = allProspects.length;
  const hot = allProspects.filter((p) => p.qualification === "HOT").length;
  const warm = allProspects.filter((p) => p.qualification === "WARM").length;

  // Compter les conversations
  const { count: conversationCount } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true });

  return (
    <div className="min-h-screen bg-ink">
      <DashboardHeader companyName={ctx.companyName} userName={ctx.userName} />

      <Container className="py-10">
        <Eyebrow>Vue d&apos;ensemble</Eyebrow>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper">
          Bonjour {ctx.userName.split(" ")[0]}
        </h1>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/60">Prospects</span>
            <p className="mt-1 font-display text-2xl font-semibold text-paper">{total}</p>
          </div>
          <div className="rounded-xl border border-status/30 bg-status/5 p-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-status/60">Hot</span>
            <p className="mt-1 font-display text-2xl font-semibold text-status">{hot}</p>
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400/60">Warm</span>
            <p className="mt-1 font-display text-2xl font-semibold text-amber-400">{warm}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/60">Conversations</span>
            <p className="mt-1 font-display text-2xl font-semibold text-paper">{conversationCount ?? 0}</p>
          </div>
        </div>

        {/* Liste */}
        <div className="mt-8">
          <ProspectList prospects={allProspects} activeFilter={activeFilter} locale={locale} />
        </div>
      </Container>
    </div>
  );
}
