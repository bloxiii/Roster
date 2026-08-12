import type { DemoAgencyConfig } from "./types";

/**
 * Registre de la démo publique Velinova (/demo).
 *
 * Contrairement à une première version de ce système (qui créait une page
 * par vraie agence prospectée, sur /demo/[slug]), il n'existe désormais
 * qu'UNE seule entrée ici : une agence 100% fictive, créée pour montrer à
 * quoi ressemblerait Velinova intégré à un site d'agence immobilière.
 * Aucune donnée réelle (biens, adresse, nom) — tout est inventé.
 *
 * Le tableau reste la structure d'origine (au cas où un second profil de
 * démo serait utile un jour — ex: une variante "location" vs "vente") mais
 * app/[locale]/demo/page.tsx ne rend que DEFAULT_DEMO_SLUG.
 */

/** Valeur de companies.plan pour le compte Velinova de cette démo publique
 * — permet à /api/agent/chat d'appliquer un rate limit dédié plus strict
 * (voir lib/rate-limit.ts) sans dépendre d'un ID de company codé en dur. */
export const DEMO_COMPANY_PLAN = "demo-showcase";

export const DEFAULT_DEMO_SLUG = "atrium-immobilier";

export const DEMO_AGENCIES: DemoAgencyConfig[] = [
  {
    slug: DEFAULT_DEMO_SLUG,
    name: "Atrium Immobilier",
    city: "Paris",
    areaDescription: "Paris et Île-de-France",
    website: "https://velinova.xyz",
    tagline: "Votre partenaire de confiance pour acheter, vendre ou louer en toute sérénité.",
    services: ["Vente", "Achat", "Location", "Estimation gratuite", "Gestion locative"],
    branding: {
      primary: "#0F4C4A",
      primaryDark: "#0A3532",
      accent: "#C08A4E",
      onPrimary: "#F6F3EC",
      surface: "#FFFFFF",
      surfaceAlt: "#F1EDE3",
      text: "#122624",
      textMuted: "#5C6B69",
    },
    properties: [
      {
        title: "Appartement lumineux avec balcon",
        type: "Appartement",
        transaction: "vente",
        city: "Paris 11e",
        price: "425 000 €",
        surfaceM2: 62,
        rooms: 3,
        description: "3 pièces traversant, cuisine ouverte, balcon filant, proche métro et commerces.",
      },
      {
        title: "Loft atypique dernier étage",
        type: "Appartement",
        transaction: "vente",
        city: "Paris 10e",
        price: "610 000 €",
        surfaceM2: 88,
        rooms: 4,
        description: "Volumes atypiques, verrière, poutres apparentes, sans vis-à-vis.",
      },
      {
        title: "Maison de ville avec jardin",
        type: "Maison",
        transaction: "vente",
        city: "Vincennes",
        price: "780 000 €",
        surfaceM2: 120,
        rooms: 6,
        bedrooms: 4,
        description: "6 pièces dont 4 chambres, jardin clos, double séjour, garage.",
      },
      {
        title: "Studio investisseur",
        type: "Appartement",
        transaction: "location",
        city: "Paris 15e",
        price: "890 €/mois",
        surfaceM2: 22,
        rooms: 1,
        description: "Studio meublé, proche transports, idéal étudiant ou jeune actif.",
      },
      {
        title: "T2 rénové avec parking",
        type: "Appartement",
        transaction: "location",
        city: "Montreuil",
        price: "1 150 €/mois",
        surfaceM2: 45,
        rooms: 2,
        description: "Entièrement rénové, place de parking incluse, calme et lumineux.",
      },
      {
        title: "Maison familiale avec piscine",
        type: "Maison",
        transaction: "vente",
        city: "Saint-Maur-des-Fossés",
        price: "965 000 €",
        surfaceM2: 165,
        rooms: 7,
        bedrooms: 5,
        description: "7 pièces dont 5 chambres, piscine, grand jardin arboré, quartier résidentiel.",
      },
    ],
    seed: { loginEmail: "demo@velinova.xyz" },
  },
];

/** Recherche une configuration de démo par son slug interne. */
export function getDemoAgency(slug: string): DemoAgencyConfig | undefined {
  return DEMO_AGENCIES.find((a) => a.slug === slug);
}
