import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { outreachUpdateSchema } from "@/lib/validations";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdminEmail(user?.email);
}

/**
 * PATCH /api/outreach/targets/[id] — Met à jour le statut d'une cible
 * (ex: "marquer comme répondu" / annuler). Route admin-gated.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = outreachUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 422 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("outreach_targets")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[outreach/targets] Update failed:", error);
    return NextResponse.json({ error: "Échec de la mise à jour." }, { status: 500 });
  }

  return NextResponse.json({ target: data });
}

/**
 * DELETE /api/outreach/targets/[id] — Supprime une cible. Route admin-gated.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { id } = await params;

  const service = createServiceClient();
  const { error } = await service.from("outreach_targets").delete().eq("id", id);

  if (error) {
    console.error("[outreach/targets] Delete failed:", error);
    return NextResponse.json({ error: "Échec de la suppression." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
