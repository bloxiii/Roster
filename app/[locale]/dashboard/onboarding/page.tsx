import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getUserContext } from "@/lib/supabase/context";
import { getAuthenticatedClient } from "@/lib/supabase/context";
import { OnboardingFlow } from "./OnboardingFlow";

export const metadata: Metadata = {
  title: "Bienvenue — Velinova",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const ctx = await getUserContext(locale);
  const supabase = await getAuthenticatedClient();

  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .limit(1);

  const { data: widgetKeys } = await supabase
    .from("widget_keys")
    .select("key, agents(name)")
    .limit(1);

  const agent = agents?.[0] ?? null;
  const widgetKey = widgetKeys?.[0]?.key ?? "";
  const agentName = widgetKeys?.[0]?.agents
    ? (widgetKeys[0].agents as unknown as { name: string }).name
    : "Emma";

  return (
    <OnboardingFlow
      companyName={ctx.companyName}
      companyId={ctx.companyId}
      agent={agent}
      widgetKey={widgetKey}
      agentName={agentName}
      locale={locale}
    />
  );
}
