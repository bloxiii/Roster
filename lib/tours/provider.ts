/**
 * Interface fournisseur de reconstruction 3D (section 03 de l'analyse
 * Velinova 3D — API externe vs pipeline maison).
 *
 * Toute la logique métier (routes API, dashboard) parle à cette interface,
 * jamais directement à un fournisseur. Ça garde le choix réversible :
 * un fournisseur externe (Luma/Polycam/...) et notre pipeline maison
 * (worker/ — COLMAP + gsplat sur GPU serverless) l'implémentent tous les
 * deux de la même façon, et on bascule via la variable d'env THREED_PROVIDER
 * sans toucher au reste de l'application.
 */

export type CreateJobInput = {
  tourId: string;
  /** URL signée, temporaire, pointant vers la vidéo dans le bucket privé. */
  videoUrl: string;
  /** URL absolue vers laquelle le fournisseur/worker doit POSTer le résultat. */
  webhookUrl: string;
};

export type CreateJobResult = {
  providerJobId: string;
};

export interface ThreeDProvider {
  /** Nom stable stocké dans tours.provider — pour l'historique/debug. */
  readonly name: string;

  /** Démarre un job de reconstruction. Ne bloque pas jusqu'à la fin — le
   * résultat arrive plus tard via webhook (voir app/api/tours/webhook). */
  createJob(input: CreateJobInput): Promise<CreateJobResult>;
}

/**
 * Résout le fournisseur actif depuis l'environnement. Un seul fournisseur
 * actif à la fois pour le MVP — pas de fallback automatique entre
 * fournisseurs (ça masquerait des échecs plutôt que de les traiter,
 * cf. section 06 sur la détection de vidéo insuffisante).
 */
export async function getThreeDProvider(): Promise<ThreeDProvider> {
  const name = process.env.THREED_PROVIDER ?? "modal";

  switch (name) {
    case "modal": {
      const { ModalProvider } = await import("./providers/modal");
      return new ModalProvider();
    }
    default:
      throw new Error(`[tours] Fournisseur 3D inconnu : "${name}"`);
  }
}
