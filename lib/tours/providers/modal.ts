import type { ThreeDProvider, CreateJobInput, CreateJobResult } from "../provider";

/**
 * Pipeline maison (COLMAP + 3D Gaussian Splatting via gsplat) déployé sur
 * Modal en tant que fonction GPU serverless — voir worker/ à la racine du
 * repo pour le code du pipeline et les instructions de déploiement.
 *
 * "Modal" ici désigne l'infrastructure d'exécution (GPU à la demande, scale
 * à zéro), pas un fournisseur de reconstruction 3D tiers — le code de
 * reconstruction est le nôtre (section 03 : option B, pas option A).
 *
 * ⚠️ Nécessite que le worker soit déployé (`modal deploy` depuis worker/)
 * et que THREED_WORKER_URL pointe vers l'endpoint HTTPS obtenu. Sans ça,
 * createJob échoue explicitement plutôt que de simuler un succès.
 */
export class ModalProvider implements ThreeDProvider {
  readonly name = "modal";

  async createJob(input: CreateJobInput): Promise<CreateJobResult> {
    const workerUrl = process.env.THREED_WORKER_URL;
    const webhookSecret = process.env.THREED_WEBHOOK_SECRET;

    if (!workerUrl) {
      throw new Error(
        "[tours/modal] THREED_WORKER_URL n'est pas configurée — déployez worker/ sur Modal " +
          "(voir worker/README.md) puis renseignez l'URL obtenue.",
      );
    }
    if (!webhookSecret) {
      throw new Error("[tours/modal] THREED_WEBHOOK_SECRET n'est pas configurée.");
    }

    // THREED_WORKER_URL est l'URL complète du endpoint Modal telle
    // qu'affichée par `modal deploy` (ex: https://<org>--velinova-3d-worker-
    // reconstruct-endpoint.modal.run) — pas de chemin à ajouter, cf.
    // worker/README.md.
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": webhookSecret,
      },
      body: JSON.stringify({
        tour_id: input.tourId,
        video_url: input.videoUrl,
        webhook_url: input.webhookUrl,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `[tours/modal] Échec de la création du job (${response.status}) : ${detail}`,
      );
    }

    const data = (await response.json()) as { job_id: string };
    return { providerJobId: data.job_id };
  }
}
