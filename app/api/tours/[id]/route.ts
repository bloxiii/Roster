import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tours/[id] — Statut d'une visite, pour le polling léger du
 * dashboard pendant le traitement (TourStatus.tsx). RLS fait le filtrage
 * par entreprise — un utilisateur ne peut interroger que ses propres visites.
 */
export async function GET(
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

  const { data: tour, error } = await supabase
    .from("tours")
    .select("id, title, status, error, scene_url, thumbnail_url, quality, public_slug, created_at, processed_at")
    .eq("id", id)
    .single();

  if (error || !tour) {
    return NextResponse.json({ error: "Visite introuvable." }, { status: 404 });
  }

  return NextResponse.json({ tour });
}
