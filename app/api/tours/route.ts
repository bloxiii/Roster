import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createTourSchema } from "@/lib/validations";
import { videoStoragePath, createVideoUploadUrl } from "@/lib/tours/storage";
import { rateLimiters } from "@/lib/rate-limit";

/**
 * POST /api/tours — Crée l'enregistrement d'une visite 3D et renvoie de quoi
 * uploader la vidéo directement depuis le navigateur vers le stockage
 * (section 09 : on ne fait jamais transiter le fichier vidéo par cette route).
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (rateLimiters.tours(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Merci de réessayer plus tard." },
      { status: 429 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Aucune entreprise associée à ce compte." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = createTourSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const tourId = randomUUID();
  const videoPath = videoStoragePath(membership.company_id, tourId, parsed.data.mimeType);

  const { error: insertError } = await supabase.from("tours").insert({
    id: tourId,
    company_id: membership.company_id,
    created_by: user.id,
    title: parsed.data.title,
    address: parsed.data.address || null,
    status: "uploading",
    video_path: videoPath,
  });

  if (insertError) {
    console.error("[api/tours] Échec de création de la visite", insertError);
    return NextResponse.json({ error: "Échec de création de la visite." }, { status: 500 });
  }

  try {
    const upload = await createVideoUploadUrl(videoPath);
    return NextResponse.json({
      tourId,
      bucket: "tour-videos",
      path: upload.path,
      token: upload.token,
    });
  } catch (error) {
    console.error("[api/tours] Échec de création de l'URL d'upload", error);
    // On laisse la ligne "uploading" en base — l'agent peut réessayer depuis
    // le dashboard plutôt que de perdre le titre/adresse déjà saisis.
    return NextResponse.json({ error: "Échec de préparation de l'upload." }, { status: 500 });
  }
}
