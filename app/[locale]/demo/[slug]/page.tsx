import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getDemoAgency } from "@/lib/demo/agencies";
import { getDemoWidgetInfo } from "@/lib/demo/get-widget-key";
import { DemoDisclaimerBar } from "@/components/demo/DemoDisclaimerBar";
import { DemoHeader } from "@/components/demo/DemoHeader";
import { DemoHero } from "@/components/demo/DemoHero";
import { DemoServices } from "@/components/demo/DemoServices";
import { DemoProperties } from "@/components/demo/DemoProperties";
import { DemoFooter } from "@/components/demo/DemoFooter";
import { VelinovaEmbed } from "@/components/demo/VelinovaEmbed";

export const dynamic = "force-dynamic";

type Params = { locale: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agency = getDemoAgency(slug);

  if (!agency) {
    return { title: "Démonstration introuvable — Velinova" };
  }

  return {
    title: `${agency.name} × Velinova — Démonstration`,
    description: `Démonstration Velinova personnalisée pour ${agency.name} (${agency.city}) — non affiliée à l'agence.`,
    // Pages de prospection privées : jamais indexées, jamais suivies.
    robots: { index: false, follow: false },
  };
}

/**
 * /demo/[slug] — démonstration personnalisée envoyée en prospection à une
 * agence immobilière (voir lib/demo/agencies.ts pour le registre).
 *
 * Page publique, sans authentification : le lien est destiné à être ouvert
 * directement par le prospect depuis un email. Le chat est le VRAI widget
 * Velinova (public/widget/velinova-widget.js), avec la widget key du
 * compte Velinova créé pour cette agence si `npm run seed:demo-agencies`
 * a déjà tourné — sinon il retombe sur le comportement générique, la page
 * reste fonctionnelle dans tous les cas (voir getDemoWidgetInfo).
 */
export default async function AgencyDemoPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const agency = getDemoAgency(slug);
  if (!agency) notFound();

  const { widgetKey } = await getDemoWidgetInfo(slug);

  return (
    <div className="font-sans" style={{ background: agency.branding.surface }}>
      <DemoDisclaimerBar agencyName={agency.name} />
      <DemoHeader agency={agency} />
      <main>
        <DemoHero agency={agency} />
        <DemoServices agency={agency} />
        <DemoProperties agency={agency} />
      </main>
      <DemoFooter agency={agency} />
      <VelinovaEmbed slug={agency.slug} widgetKey={widgetKey} />
    </div>
  );
}
