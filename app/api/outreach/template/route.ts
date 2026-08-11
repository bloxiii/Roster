import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { outreachTemplateSchema } from "@/lib/validations";
import { DEFAULT_OUTREACH_TEMPLATE } from "@/lib/outreach/email";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdminEmail(user?.email);
}

/**
 * PUT /api/outreach/template — Met à jour le template email d'outreach
 * (singleton, id='default'). Route admin-gated.
 */
export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = outreachTemplateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("outreach_email_template")
    .upsert({
      id: "default",
      subject: parsed.data.subject,
      body: parsed.data.body,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[outreach/template] Update failed:", error);
    return NextResponse.json({ error: "Échec de l'enregistrement." }, { status: 500 });
  }

  return NextResponse.json({ template: data ?? DEFAULT_OUTREACH_TEMPLATE });
}
