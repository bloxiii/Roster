import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { outreachSendSchema } from "@/lib/validations";
import { sendOutreachEmail, DEFAULT_OUTREACH_TEMPLATE } from "@/lib/outreach/email";

/**
 * POST /api/outreach/send — Envoie l'email de prospection pour une cible
 * et journalise le résultat (status/sent_at/error) sur la ligne concernée.
 * Route interne, admin-gated (voir lib/admin.ts).
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

  const parsed = outreachSendSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 422 });
  }

  const service = createServiceClient();

  const { data: target, error: fetchError } = await service
    .from("outreach_targets")
    .select("id, agency_name, contact_name, email, website")
    .eq("id", parsed.data.targetId)
    .single();

  if (fetchError || !target) {
    return NextResponse.json({ error: "Cible introuvable." }, { status: 404 });
  }

  const { data: templateRow } = await service
    .from("outreach_email_template")
    .select("subject, body")
    .eq("id", "default")
    .single();

  const result = await sendOutreachEmail(target, templateRow ?? DEFAULT_OUTREACH_TEMPLATE);

  const { data: updated, error: updateError } = await service
    .from("outreach_targets")
    .update(
      result.delivered
        ? { status: "sent", sent_at: new Date().toISOString(), error: null }
        : { status: "failed", error: result.error ?? "Échec inconnu." },
    )
    .eq("id", target.id)
    .select()
    .single();

  if (updateError) {
    console.error("[outreach/send] Update failed:", updateError);
  }

  if (!result.delivered) {
    return NextResponse.json(
      { error: result.error ?? "Échec de l'envoi.", target: updated ?? target },
      { status: 502 },
    );
  }

  return NextResponse.json({ target: updated ?? target });
}
