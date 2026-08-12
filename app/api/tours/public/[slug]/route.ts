import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";
import type { PublicTour } from "@/lib/tours/types";

/**
 * GET /api/tours/public/[slug] — Lecture publique d'une visite, pour le
 * viewer non authentifié (/v/[slug]). Ne passe jamais par le client RLS :
 * un visiteur anonyme n'a pas de session, donc pas de company_id à matcher.
 *
 * Ne renvoie QUE les champs sûrs à exposer (voir PublicTour) — jamais
 * l'adresse complète, le company_id, ou les identifiants fournisseur.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (rateLimiters.publicTourView(ip)) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: tour, error } = await supabase
    .from("tours")
    .select("id, title, status, scene_url, thumbnail_url, waypoints, is_public, view_count")
    .eq("public_slug", slug)
    .single();

  if (error || !tour || !tour.is_public) {
    return NextResponse.json({ error: "Visite introuvable." }, { status: 404 });
  }

  // Compteur best-effort (lecture-écriture non atomique — acceptable pour un
  // compteur d'affichage, pas une donnée de facturation) : on ne bloque pas
  // la réponse au visiteur sur cette écriture secondaire.
  void supabase
    .from("tours")
    .update({ view_count: tour.view_count + 1 })
    .eq("id", tour.id)
    .then((result: { error: { message: string } | null }) => {
      if (result.error) console.error("[api/tours/public] Échec incrément view_count", result.error);
    });

  const publicTour: PublicTour = {
    title: tour.title,
    status: tour.status,
    scene_url: tour.scene_url,
    thumbnail_url: tour.thumbnail_url,
    waypoints: tour.waypoints,
  };

  return NextResponse.json({ tour: publicTour });
}
