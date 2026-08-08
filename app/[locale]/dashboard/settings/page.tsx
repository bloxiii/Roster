import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getUserContext } from "@/lib/supabase/context";
import { getAuthenticatedClient } from "@/lib/supabase/context";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Paramètres — Velin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const ctx = await getUserContext(locale);
  const supabase = await getAuthenticatedClient();

  const { data: settings } = await supabase
    .from("company_settings")
    .select("*")
    .eq("company_id", ctx.companyId)
    .single();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", ctx.companyId)
    .single();

  const { data: widgetKeys } = await supabase
    .from("widget_keys")
    .select("key, agent_id, allowed_domains, is_active, agents(name)")
    .eq("company_id", ctx.companyId);

  return (
    <div className="max-w-3xl">
      <Eyebrow>Paramètres</Eyebrow>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper">
        Configuration
      </h1>

      <SettingsForm
        companyId={ctx.companyId}
        company={company}
        settings={settings}
        widgetKeys={widgetKeys ?? []}
      />
    </div>
  );
}
