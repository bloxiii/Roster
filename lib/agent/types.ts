/** Message dans une conversation agent. */
export type AgentMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Données prospect extraites par l'agent. */
export type ProspectData = {
  prenom: string | null;
  type_projet: "achat" | "location" | null;
  type_bien: "appartement" | "maison" | "terrain" | "local_commercial" | null;
  localisation: string | null;
  surface_m2: string | null;
  nombre_pieces: string | null;
  budget: string | null;
  delai: "urgent" | "1-3 mois" | "3-6 mois" | "pas pressé" | null;
  contact_email: string | null;
  contact_telephone: string | null;
  qualification: "HOT" | "WARM" | "COLD";
  resume: string;
  notes_commerciales: string;
};

/** Fiche prospect complète avec métadonnées. */
export type ProspectRecord = {
  id: string;
  agentId: string;
  /** Identifiant du client (agence) — prépare le multi-tenant. */
  clientId: string;
  createdAt: string;
  data: ProspectData;
  /** Historique complet de la conversation. */
  conversation: AgentMessage[];
  conversationLength: number;
  /** Date d'envoi de la notification email (null si pas encore envoyée). */
  notifiedAt: string | null;
};

/** Payload envoyé par le client au endpoint /api/agent/chat. */
export type ChatRequest = {
  messages: AgentMessage[];
  conversationId?: string;
};

/** Réponse du endpoint /api/agent/chat. */
export type ChatResponse = {
  reply: string;
  prospect?: ProspectData;
  /**
   * Présent uniquement avec `prospect` : true si la fiche a réellement été
   * persistée en base (voir saveProspect) — permet au widget d'afficher une
   * confirmation honnête ("conversation enregistrée") plutôt qu'un message
   * générique qui pourrait mentir en cas d'échec de sauvegarde.
   */
  prospectSaved?: boolean;
  conversationId: string;
};
