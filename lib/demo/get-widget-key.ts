import { createServiceClient } from "@/lib/supabase/server";

export type DemoWidgetInfo = {
  widgetKey: string | null;
  agentName: string | null;
};

/**
 * Résout la widget key active du compte Velinova associé à une démo
 * d'agence (créé par scripts/seed-demo-agencies.ts — voir lib/demo/agencies.ts
 * pour le mapping slug → agence).
 *
 * Ne lève jamais : si le compte n'existe pas encore (script de seed pas
 * encore lancé) ou si Supabase n'est pas configuré, la page /demo/[slug]
 * doit quand même s'afficher — le widget retombe alors sur le comportement
 * générique (voir public/widget/velinova-widget.js).
 */
export async function getDemoWidgetInfo(slug: string): Promise<DemoWidgetInfo> {
  try {
    const supabase = createServiceClient();

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!company) return { widgetKey: null, agentName: null };

    const { data: widgetKeyRow } = await supabase
      .from("widget_keys")
      .select("key, agents(name)")
      .eq("company_id", company.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!widgetKeyRow) return { widgetKey: null, agentName: null };

    const agent = widgetKeyRow.agents as unknown as { name: string } | null;
    return { widgetKey: widgetKeyRow.key, agentName: agent?.name ?? null };
  } catch (error) {
    console.error("[demo] Impossible de résoudre la widget key:", error);
    return { widgetKey: null, agentName: null };
  }
}
