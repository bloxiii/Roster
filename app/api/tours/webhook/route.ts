import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { tourWebhookSchema } from "@/lib/validations";
import { deleteVideo } from "@/lib/tours/storage";

/**
 * POST /api/tours/webhook — Appelé par le worker de reconstruction
 * (worker/, déployé sur Modal) à la fin d'un job, succès ou échec.
 *
 * Authentification par secret partagé (pas de session utilisateur possible
 * ici : l'appelant est un service, pas un navigateur). Le worker vit hors
 * de notre RLS Supabase, donc cette route utilise le service role pour
 * écrire — c'est la seule route de tours/* à le faire.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.THREED_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = tourWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { tourId, providerJobId, status, sceneUrl, thumbnailUrl, waypoints, quality, error } =
    parsed.data;

  const supabase = createServiceClient();

  const { data: tour, error: fetchError } = await supabase
    .from("tours")
    .select("id, provider_job_id, video_path")
    .eq("id", tourId)
    .single();

  if (fetchError || !tour) {
    return NextResponse.json({ error: "Visite introuvable." }, { status: 404 });
  }

  // Le job_id doit correspondre à celui qu'on a nous-mêmes attribué — évite
  // qu'un webhook rejoué ou mal formé écrase une visite déjà retraitée.
  if (tour.provider_job_id !== providerJobId) {
    return NextResponse.json({ error: "provider_job_id ne correspond pas." }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from("tours")
    .update({
      status,
      scene_url: sceneUrl ?? null,
      thumbnail_url: thumbnailUrl ?? null,
      waypoints: waypoints ?? [],
      quality: quality ?? {},
      error: status === "failed" ? (error ?? "Échec du traitement (raison inconnue).") : null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", tourId);

  if (updateError) {
    console.error("[api/tours/webhook] Échec de mise à jour", updateError);
    return NextResponse.json({ error: "Échec de mise à jour de la visite." }, { status: 500 });
  }

  // Succès → la vidéo source ne sert plus, on la supprime immédiatement
  // (section 11, RGPD). En cas d'échec, on la garde pour permettre un
  // nouveau traitement sans re-upload — sa purge après un délai plus long
  // en cas d'échecs répétés reste à construire (hors MVP, cf. analyse §12).
  if (status === "ready" && tour.video_path) {
    try {
      await deleteVideo(tour.video_path);
      await supabase
        .from("tours")
        .update({ video_path: null, video_deleted_at: new Date().toISOString() })
        .eq("id", tourId);
    } catch (err) {
      // Non bloquant : la visite est prête, la suppression vidéo est un
      // nettoyage secondaire — on log plutôt que de faire échouer le webhook.
      console.error("[api/tours/webhook] Échec de suppression de la vidéo source", err);
    }
  }

  return NextResponse.json({ success: true });
}
