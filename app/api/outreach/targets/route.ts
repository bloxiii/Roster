import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { outreachTargetSchema } from "@/lib/validations";

/**
 * POST /api/outreach/targets — Ajoute une cible de prospection.
 * Route interne, admin-gated (voir lib/admin.ts) — pas d'accès public,
 * pas de rate limiting (usage manuel, faible volume).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = outreachTargetSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("outreach_targets")
    .insert({
      agency_name: parsed.data.agency_name,
      contact_name: parsed.data.contact_name || null,
      email: parsed.data.email,
      website: parsed.data.website || null,
      city: parsed.data.city || null,
      postal_code: parsed.data.postal_code || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[outreach/targets] Insert failed:", error);
    return NextResponse.json({ error: "Échec de l'ajout." }, { status: 500 });
  }

  return NextResponse.json({ target: data });
}
