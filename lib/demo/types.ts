/**
 * Types pour le système de démonstrations personnalisées Velinova
 * (agences immobilières prospectées — voir /demo/[slug]).
 *
 * Une entrée de ce registre pilote à la fois :
 * 1. Le rendu de la page /demo/[slug] (branding, biens affichés) ;
 * 2. Le system prompt de l'agent Velinova associé au compte de l'agence
 *    (voir lib/demo/system-prompt.ts et scripts/seed-demo-agencies.ts).
 *
 * Ajouter une agence = ajouter une entrée dans lib/demo/agencies.ts, rien
 * d'autre à modifier pour que /demo/<slug> fonctionne.
 */

/** Un bien immobilier réellement publié par l'agence, utilisé uniquement pour la démo. */
export type DemoProperty = {
  title: string;
  type: "Appartement" | "Maison";
  transaction: "vente" | "location";
  city: string;
  /** Prix déjà formaté pour l'affichage, ex: "179 000 €" ou "880 €/mois". */
  price: string;
  surfaceM2: number;
  /** Nombre de pièces, si l'info était disponible. */
  rooms?: number;
  /** Nombre de chambres, si l'info était disponible (distincte des pièces). */
  bedrooms?: number;
  description: string;
  /** Page source (catégorie du site de l'agence) où ce type de bien a été identifié. */
  sourceUrl?: string;
};

/** Identité visuelle approximative de l'agence — inspirée, pas copiée pixel pour pixel. */
export type DemoAgencyBranding = {
  /** Couleur principale (nav, boutons, liens). */
  primary: string;
  /** Variante plus foncée (hover, bandeaux). */
  primaryDark: string;
  /** Couleur secondaire / accent (badges, séparateurs). */
  accent: string;
  /** Couleur de texte lisible sur fond `primary`. */
  onPrimary: string;
  /** Fond général de la page. */
  surface: string;
  /** Fond alterné (sections). */
  surfaceAlt: string;
  /** Texte principal. */
  text: string;
  /** Texte secondaire / discret. */
  textMuted: string;
};

export type DemoAgencyConfig = {
  /** Slug d'URL — /demo/[slug]. Doit rester stable une fois envoyé en prospection. */
  slug: string;
  name: string;
  city: string;
  /** Adresse complète, uniquement si vérifiée avec confiance. */
  address?: string;
  /** Description de zone à utiliser à la place d'une adresse précise non vérifiée. */
  areaDescription?: string;
  website: string;
  tagline: string;
  services: string[];
  branding: DemoAgencyBranding;
  /** 0 à 6 biens représentatifs. Vide = agence "sur consultation", voir noCatalogNote. */
  properties: DemoProperty[];
  /** Message affiché à la place de la grille de biens quand properties est vide. */
  noCatalogNote?: string;
  /** Compte Velinova associé (créé par scripts/seed-demo-agencies.ts). */
  seed: {
    loginEmail: string;
  };
};
