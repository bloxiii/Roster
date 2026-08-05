import { defineRouting } from "next-intl/routing";

/**
 * Locales supportées par le site.
 * "fr" est la locale par défaut : les URLs françaises ne portent pas de préfixe (/, /agents),
 * les URLs anglaises sont préfixées (/en, /en/agents).
 */
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
