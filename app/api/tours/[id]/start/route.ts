import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createVideoReadUrl } from "@/lib/tours/storage";
import { getThreeDProvider } from "@/lib/tours/provider";

/**
 * POST /api/tours/[id]/start — Déclenche la reconstruction 3D une fois
 * l'upload vidéo terminé côté navigateur (le navigateur POST ici juste
 * après avoir fini l'upload direct vers le stockage, cf. TourUploadForm).
 *
 * Ne fait AUCUN calcul ici : crée juste le job chez le fournisseur/worker
 * (section 09 — le calcul GPU vit hors de cette fonction serverless) et
 * marque le statut "processing". Le résultat arrivera via le webhook.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: tour, error: fetchError } = await supabase
    .from("tours")
    .select("id, status, video_path")
    .eq("id", id)
    .single();

  if (fetchError || !tour) {
    return NextResponse.json({ error: "Visite introuvable." }, { status: 404 });
  }
  if (tour.status !== "uploading" && tour.status !== "failed") {
    return NextResponse.json(
      { error: `Cette visite est déjà au statut "${tour.status}".` },
      { status: 409 },
    );
  }
  if (!tour.video_path) {
    return NextResponse.json({ error: "Aucune vidéo associée à cette visite." }, { status: 400 });
  }

  try {
    const videoUrl = await createVideoReadUrl(tour.video_path);

    // Le worker doit pouvoir joindre cette URL depuis Internet — en dev
    // local, exposez-la via un tunnel (ex. ngrok) et positionnez
    // NEXT_PUBLIC_APP_URL en conséquence, sinon le webhook de fin de
    // traitement ne pourra jamais revenir jusqu'ici.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    const webhookUrl = `${baseUrl}/api/tours/webhook`;

    const provider = await getThreeDProvider();
    const job = await provider.createJob({ tourId: id, videoUrl, webhookUrl });

    const { error: updateError } = await supabase
      .from("tours")
      .update({
        status: "processing",
        provider: provider.name,
        provider_job_id: job.providerJobId,
        error: null,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ status: "processing" });
  } catch (error) {
    console.error("[api/tours/start] Échec du déclenchement", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue.";

    await supabase
      .from("tours")
      .update({ status: "failed", error: `Échec du démarrage du traitement : ${message}` })
      .eq("id", id);

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
