"use client";

import Script from "next/script";

type WidgetColors = { bg: string; bot: string; user: string };

/**
 * Embarque le VRAI script d'intégration Velinova (public/widget/velinova-widget.js)
 * — exactement celui qu'un client copierait dans son site — pour que la démo
 * soit fidèle à 100% au produit réel, bulle flottante comprise.
 *
 * `id` unique par agence : évite que Next dédoublonne/ignore le script quand
 * on navigue côté client d'une démo à l'autre (même `src` sinon).
 *
 * `colors`, si fourni, force les 3 couleurs du widget via les attributs HTML
 * (prioritaires sur la config distante du dashboard — voir l'en-tête de
 * velinova-widget.js) pour que le chat reprenne l'identité de l'agence
 * plutôt que le thème Velinova par défaut, comme sur un vrai site intégré.
 */
export function VelinovaEmbed({
  slug,
  widgetKey,
  colors,
  autoOpen,
}: {
  slug: string;
  widgetKey: string | null;
  colors?: WidgetColors;
  /** Ouvre le panneau de chat automatiquement au chargement de la page
   * (voir data-velinova-auto-open dans velinova-widget.js) — utile sur la
   * démo publique pour que le visiteur voie l'agent tout de suite au lieu
   * de devoir cliquer sur la bulle flottante. */
  autoOpen?: boolean;
}) {
  return (
    <Script
      id={`velinova-embed-${slug}`}
      src="/widget/velinova-widget.js"
      strategy="afterInteractive"
      data-velinova-key={widgetKey ?? undefined}
      data-velinova-position="right"
      data-velinova-bg-color={colors?.bg}
      data-velinova-bot-color={colors?.bot}
      data-velinova-user-color={colors?.user}
      data-velinova-auto-open={autoOpen ? "true" : undefined}
    />
  );
}
