import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/agent/prospects — Liste des prospects (dashboard).
 * Authentification Supabase + isolation par company_id via RLS.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const qualification = searchParams.get("qualification");

  // Le RLS filtre automatiquement par company_id
  let query = supabase
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false });

  if (qualification && ["HOT", "WARM", "COLD"].includes(qualification)) {
    query = query.eq("qualification", qualification);
  }

  const { data: prospects, error } = await query;

  if (error) {
    console.error("[prospects] Query failed:", error);
    return NextResponse.json({ error: "Erreur de requête." }, { status: 500 });
  }

  return NextResponse.json({ prospects: prospects ?? [] });
}
