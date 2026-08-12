import type { DemoAgencyConfig } from "./types";

/**
 * Registre des démonstrations personnalisées Velinova pour agences
 * immobilières (prospection commerciale — voir mission "5 démos Chantilly").
 *
 * Source des données : les sites officiels de ces agences ne sont pas
 * accessibles directement depuis cet environnement (proxy réseau), les
 * informations ci-dessous ont donc été rassemblées via des recherches web
 * ciblées (extraits indexés des pages d'annonces des agences elles-mêmes,
 * cf. `sourceUrl` sur chaque bien). Les couleurs de marque sont une
 * approximation stylistique inspirée du positionnement de chaque agence
 * (nom, secteur, gamme de prix) — PAS une extraction exacte de leur charte
 * graphique. Avant un envoi de prospection à grande échelle, une relecture
 * rapide par un humain (prix/surfaces encore d'actualité, ton de la page)
 * est recommandée.
 *
 * Ajouter une agence : ajouter une entrée ici (slug unique, jamais changé
 * une fois envoyé en prospection), puis exécuter
 * `npm run seed:demo-agencies` pour créer son compte Velinova.
 */
export const DEMO_AGENCIES: DemoAgencyConfig[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. L'Agence Immo — Chantilly
  // ─────────────────────────────────────────────────────────────
  {
    slug: "lagence-immo-chantilly",
    name: "L'Agence Immo",
    city: "Chantilly",
    address: "77 rue du Connétable, 60500 Chantilly",
    website: "https://www.lagence.immo/",
    tagline: "L'agence de proximité au cœur du centre historique de Chantilly.",
    services: ["Vente", "Achat", "Location", "Estimation gratuite"],
    branding: {
      primary: "#1C2C45",
      primaryDark: "#121D2E",
      accent: "#C9A24B",
      onPrimary: "#F7F5F0",
      surface: "#FFFFFF",
      surfaceAlt: "#F4EEE2",
      text: "#1C2C45",
      textMuted: "#5B6577",
    },
    properties: [
      {
        title: "Appartement lumineux proche château",
        type: "Appartement",
        transaction: "vente",
        city: "Chantilly",
        price: "179 000 €",
        surfaceM2: 58,
        rooms: 3,
        description: "3 pièces au calme, à quelques minutes à pied du centre-ville et du château.",
        sourceUrl: "https://www.lagence.immo/ville_bien/Chantilly__1__Vente/immobilier-chantilly.html",
      },
      {
        title: "Appartement familial rue du Connétable",
        type: "Appartement",
        transaction: "vente",
        city: "Chantilly",
        price: "690 000 €",
        surfaceM2: 102,
        rooms: 4,
        description: "Grand 4 pièces en plein centre-ville, proche commerces et gare.",
        sourceUrl: "https://www.lagence.immo/ville_bien/Chantilly__1__Vente/immobilier-chantilly.html",
      },
      {
        title: "Appartement de standing centre-ville",
        type: "Appartement",
        transaction: "vente",
        city: "Chantilly",
        price: "545 000 €",
        surfaceM2: 106,
        rooms: 3,
        description: "3 pièces généreux, belles prestations, emplacement recherché.",
        sourceUrl: "https://www.lagence.immo/ville_bien/Chantilly__1__Vente/immobilier-chantilly.html",
      },
      {
        title: "Maison avec jardin",
        type: "Maison",
        transaction: "vente",
        city: "Chantilly",
        price: "525 000 €",
        surfaceM2: 99,
        rooms: 5,
        description: "5 pièces avec extérieur, quartier calme et résidentiel.",
        sourceUrl: "https://www.lagence.immo/ville_bien/Chantilly__2__Vente/immobilier-chantilly.html",
      },
      {
        title: "Grande maison familiale",
        type: "Maison",
        transaction: "vente",
        city: "Chantilly",
        price: "499 000 €",
        surfaceM2: 150,
        rooms: 8,
        description: "8 pièces, beau volume pour une famille nombreuse.",
        sourceUrl: "https://www.lagence.immo/ville_bien/Chantilly__2__Vente/immobilier-chantilly.html",
      },
      {
        title: "Maison de caractère",
        type: "Maison",
        transaction: "vente",
        city: "Chantilly",
        price: "930 000 €",
        surfaceM2: 160,
        rooms: 6,
        description: "6 pièces haut de gamme, belles prestations et emplacement premium.",
        sourceUrl: "https://www.lagence.immo/ville_bien/Chantilly__2__Vente/immobilier-chantilly.html",
      },
    ],
    seed: { loginEmail: "demo+lagence-immo-chantilly@velinova.xyz" },
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Guy Hoquet Chantilly
  // ─────────────────────────────────────────────────────────────
  {
    slug: "guy-hoquet-chantilly",
    name: "Guy Hoquet Chantilly",
    city: "Chantilly",
    address: "24 rue de Creil, 60500 Chantilly",
    website: "https://chantilly.guy-hoquet.com/",
    tagline: "La force d'un réseau national, l'expertise d'une équipe locale depuis 2012.",
    services: ["Achat", "Vente", "Location", "Gestion locative", "Estimation offerte"],
    branding: {
      primary: "#0091D6",
      primaryDark: "#2C2A6B",
      accent: "#2C2A6B",
      onPrimary: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceAlt: "#EEF6FC",
      text: "#151A2E",
      textMuted: "#5B6577",
    },
    properties: [
      {
        title: "Maison spacieuse centre-ville",
        type: "Maison",
        transaction: "vente",
        city: "Chantilly",
        price: "490 000 €",
        surfaceM2: 250,
        rooms: 10,
        description: "10 pièces, beau potentiel pour projet familial ou multigénérationnel.",
        sourceUrl: "https://chantilly.guy-hoquet.com/achat-immobilier/chantilly/maison-vendre",
      },
      {
        title: "Maison familiale",
        type: "Maison",
        transaction: "vente",
        city: "Chantilly",
        price: "599 000 €",
        surfaceM2: 140,
        rooms: 6,
        description: "6 pièces, quartier résidentiel calme.",
        sourceUrl: "https://chantilly.guy-hoquet.com/achat-immobilier/chantilly/maison-vendre",
      },
      {
        title: "Maison avec jardin à Avilly-Saint-Léonard",
        type: "Maison",
        transaction: "vente",
        city: "Avilly-Saint-Léonard",
        price: "389 000 €",
        surfaceM2: 110,
        rooms: 4,
        description: "4 pièces aux portes de Chantilly, secteur pavillonnaire recherché.",
        sourceUrl: "https://chantilly.guy-hoquet.com/achat-immobilier/chantilly/maison-vendre",
      },
      {
        title: "Studio / T2 centre-ville",
        type: "Appartement",
        transaction: "location",
        city: "Chantilly",
        price: "620 €/mois",
        surfaceM2: 25.94,
        rooms: 2,
        description: "Petite surface idéale premier logement ou investissement locatif.",
        sourceUrl: "https://chantilly.guy-hoquet.com/location-immobiliere/chantilly/appartement",
      },
      {
        title: "T2 lumineux centre-ville",
        type: "Appartement",
        transaction: "location",
        city: "Chantilly",
        price: "880 €/mois",
        surfaceM2: 38.99,
        rooms: 2,
        description: "2 pièces bien situé, proche commerces et gare.",
        sourceUrl: "https://chantilly.guy-hoquet.com/location-immobiliere/chantilly/appartement",
      },
    ],
    seed: { loginEmail: "demo+guy-hoquet-chantilly@velinova.xyz" },
  },

  // ─────────────────────────────────────────────────────────────
  // 3. 5ème Avenue Immobilier — Chantilly
  // ─────────────────────────────────────────────────────────────
  {
    slug: "5eme-avenue-chantilly",
    name: "5ème Avenue Immobilier",
    city: "Chantilly",
    address: "120 rue du Connétable, 60500 Chantilly",
    website: "https://www.5emeavenue-immobilier.com/",
    tagline: "Agence indépendante depuis 2012 — vente, estimation et mise en valeur de biens d'exception.",
    services: ["Vente", "Estimation gratuite sous 48h", "Mise en valeur du bien", "Conseil en investissement"],
    branding: {
      primary: "#111111",
      primaryDark: "#000000",
      accent: "#B08D57",
      onPrimary: "#FFFFFF",
      surface: "#FAFAF8",
      surfaceAlt: "#F0EDE7",
      text: "#111111",
      textMuted: "#6B6B6B",
    },
    properties: [
      {
        title: "Maison de prestige avec parc",
        type: "Maison",
        transaction: "vente",
        city: "Chantilly",
        price: "1 150 000 €",
        surfaceM2: 250,
        rooms: 8,
        bedrooms: 5,
        description: "8 pièces dont 5 chambres, belle réception, écrin de verdure.",
        sourceUrl: "https://www.5emeavenue-immobilier.com/vente/maisons/1",
      },
      {
        title: "Maison familiale haut de gamme",
        type: "Maison",
        transaction: "vente",
        city: "Chantilly",
        price: "995 000 €",
        surfaceM2: 198,
        rooms: 7,
        bedrooms: 5,
        description: "7 pièces dont 5 chambres, belles prestations, quartier résidentiel prisé.",
        sourceUrl: "https://www.5emeavenue-immobilier.com/vente/maisons/1",
      },
      {
        title: "Appartement de standing",
        type: "Appartement",
        transaction: "vente",
        city: "Chantilly",
        price: "1 059 000 €",
        surfaceM2: 146,
        rooms: 5,
        bedrooms: 3,
        description: "5 pièces dont 3 chambres, finitions haut de gamme, emplacement premium.",
        sourceUrl: "https://www.5emeavenue-immobilier.com/vente/1",
      },
      {
        title: "Appartement lumineux centre-ville",
        type: "Appartement",
        transaction: "vente",
        city: "Chantilly",
        price: "970 000 €",
        surfaceM2: 145,
        rooms: 5,
        bedrooms: 4,
        description: "5 pièces dont 4 chambres, très bon état, proche commerces.",
        sourceUrl: "https://www.5emeavenue-immobilier.com/vente/1",
      },
    ],
    seed: { loginEmail: "demo+5eme-avenue-chantilly@velinova.xyz" },
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Victoria Clément Immobilier — Chantilly / Senlis
  // ─────────────────────────────────────────────────────────────
  // Aucune annonce publique attribuable avec certitude à cette conseillère
  // n'a pu être retrouvée (positionnement conseil indépendant / discrétion,
  // cohérent avec un fonctionnement largement hors-catalogue). Le champ
  // `properties` reste donc vide plutôt que d'inventer des biens — voir
  // noCatalogNote, qui reflète honnêtement ce positionnement dans la démo
  // ET dans le system prompt de l'agent (aucun risque d'hallucination).
  {
    slug: "victoria-clement-chantilly",
    name: "Victoria Clément Immobilier",
    city: "Chantilly",
    areaDescription: "Chantilly, Senlis et leurs alentours",
    website: "https://www.victoriaclementimmobilier.com/",
    tagline: "Conseil immobilier indépendant, sur-mesure et confidentiel à Chantilly et Senlis.",
    services: ["Vente", "Achat", "Estimation sur-mesure", "Accompagnement personnalisé"],
    branding: {
      primary: "#2B2622",
      primaryDark: "#171412",
      accent: "#B98E6B",
      onPrimary: "#FBF7F4",
      surface: "#FBF7F4",
      surfaceAlt: "#F1E9E2",
      text: "#2B2622",
      textMuted: "#7A736C",
    },
    properties: [],
    noCatalogNote:
      "Victoria Clément travaille en grande partie hors-catalogue, sur des biens confidentiels réservés à ses clients accompagnés personnellement. Discutez de votre recherche avec Alex pour être mis en relation.",
    seed: { loginEmail: "demo+victoria-clement-chantilly@velinova.xyz" },
  },

  // ─────────────────────────────────────────────────────────────
  // 5. Century 21 Agence de l'Hippodrome — Chantilly
  // ─────────────────────────────────────────────────────────────
  {
    slug: "century21-chantilly",
    name: "Century 21 Agence de l'Hippodrome",
    city: "Chantilly",
    address: "4 rue de Gouvieux, 60500 Chantilly",
    website: "https://www.century21-adh-chantilly.com/",
    tagline: "L'expertise du 1er réseau immobilier mondial, au service de Chantilly et ses environs.",
    services: ["Achat", "Vente", "Location", "Gestion locative", "Estimation gratuite"],
    branding: {
      primary: "#B08D3E",
      primaryDark: "#111111",
      accent: "#111111",
      onPrimary: "#111111",
      surface: "#FFFFFF",
      surfaceAlt: "#F7F2E7",
      text: "#111111",
      textMuted: "#5C5648",
    },
    properties: [
      {
        title: "Appartement familial centre-ville",
        type: "Appartement",
        transaction: "vente",
        city: "Chantilly",
        price: "350 000 €",
        surfaceM2: 92.6,
        description: "Bel appartement familial en cœur de ville, proche de toutes commodités.",
        sourceUrl: "https://www.century21-adh-chantilly.com/annonces/achat-appartement/v-chantilly/",
      },
      {
        title: "Maison de prestige",
        type: "Maison",
        transaction: "vente",
        city: "Lamorlaye",
        price: "1 790 000 €",
        surfaceM2: 400,
        rooms: 10,
        description: "Grande propriété aux portes de Chantilly, secteur très recherché.",
        sourceUrl: "https://www.century21-adh-chantilly.com/annonces/achat/",
      },
      {
        title: "Maison familiale avec jardin",
        type: "Maison",
        transaction: "vente",
        city: "Courteuil",
        price: "620 000 €",
        surfaceM2: 136.1,
        rooms: 6,
        description: "6 pièces au calme, à quelques minutes de Chantilly.",
        sourceUrl: "https://www.century21-adh-chantilly.com/annonces/achat/",
      },
    ],
    seed: { loginEmail: "demo+century21-chantilly@velinova.xyz" },
  },
];

/** Recherche une configuration de démo par son slug d'URL. */
export function getDemoAgency(slug: string): DemoAgencyConfig | undefined {
  return DEMO_AGENCIES.find((a) => a.slug === slug);
}
