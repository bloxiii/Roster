import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ProspectList } from "@/components/dashboard/ProspectList";

export const metadata: Metadata = { title: "Prospects — Velin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ProspectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: prospects } = await supabase
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false });

  const { q } = await searchParams;
  const activeFilter = q && ["HOT", "WARM", "COLD"].includes(q) ? q : null;

  return (
    <div className="max-w-5xl">
      <Eyebrow>Prospects</Eyebrow>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper">
        Tous les prospects
      </h1>
      <div className="mt-8">
        <ProspectList prospects={prospects ?? []} activeFilter={activeFilter} locale={locale} />
      </div>
    </div>
  );
}
