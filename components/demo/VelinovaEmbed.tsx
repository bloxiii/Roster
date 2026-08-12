"use client";

import Script from "next/script";

/**
 * Embarque le VRAI script d'intégration Velinova (public/widget/velinova-widget.js)
 * — exactement celui qu'un client copierait dans son site — pour que la démo
 * soit fidèle à 100% au produit réel, bulle flottante comprise.
 *
 * `id` unique par agence : évite que Next dédoublonne/ignore le script quand
 * on navigue côté client d'une démo à l'autre (même `src` sinon).
 */
export function VelinovaEmbed({ slug, widgetKey }: { slug: string; widgetKey: string | null }) {
  return (
    <Script
      id={`velinova-embed-${slug}`}
      src="/widget/velinova-widget.js"
      strategy="afterInteractive"
      data-velinova-key={widgetKey ?? undefined}
      data-velinova-position="right"
    />
  );
}
