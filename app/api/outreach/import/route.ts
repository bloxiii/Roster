import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/pagination";
import { isAdminEmail } from "@/lib/admin";
import { outreachImportSchema, outreachImportRowSchema } from "@/lib/validations";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdminEmail(user?.email);
}

const CHUNK_SIZE = 500;

/**
 * POST /api/outreach/import — Import CSV en masse de cibles de prospection.
 *
 * Crée uniquement les lignes (status "pending" par défaut, colonne par
 * défaut de la table) — N'ENVOIE AUCUN EMAIL. L'envoi reste une action
 * manuelle, ligne par ligne, via POST /api/outreach/send.
 *
 * Chaque ligne est revalidée individuellement : une ligne invalide (email
 * mal formé, etc.) est comptabilisée et ignorée plutôt que de faire
 * échouer tout l'import. Les emails déjà présents en base (ou en double
 * dans le fichier lui-même) sont également ignorés. Route admin-gated.
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = outreachImportSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 422 });
  }

  // Validation ligne par ligne — une ligne invalide n'annule pas le reste.
  type ImportRow = {
    agency_name: string;
    email: string;
    city: string | null;
    postal_code: string | null;
    phone: string | null;
    address: string | null;
  };
  const valid: ImportRow[] = [];
  let invalid = 0;

  for (const raw of parsed.data.contacts) {
    const row = outreachImportRowSchema.safeParse(raw);
    if (!row.success) {
      invalid++;
      continue;
    }
    valid.push({
      agency_name: row.data.agency_name,
      email: row.data.email,
      city: row.data.city || null,
      postal_code: row.data.postal_code || null,
      phone: row.data.phone || null,
      address: row.data.address || null,
    });
  }

  // Déduplication au sein du fichier lui-même (même email présent plusieurs fois).
  const seen = new Set<string>();
  const deduped = valid.filter((c) => {
    const key = c.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const duplicatesInFile = valid.length - deduped.length;

  const service = createServiceClient();

  // Emails déjà en base, pour ne pas recréer un contact existant. Pagine
  // au-delà de 1000 lignes (limite par défaut Supabase/PostgREST) : sans
  // ça, passé 1000 contacts existants, la dédup ne "voit" plus les emails
  // au-delà de cette limite et peut réinsérer des doublons.
  const { data: existing, error: existingError } = await fetchAllRows<{ email: string }>((from, to) =>
    service.from("outreach_targets").select("email").range(from, to),
  );

  if (existingError) {
    console.error("[outreach/import] Fetch existing emails failed:", existingError);
    return NextResponse.json({ error: "Échec de la lecture des contacts existants." }, { status: 500 });
  }

  const existingEmails = new Set(
    (existing ?? []).map((e: { email: string }) => e.email.toLowerCase()),
  );
  const toInsert = deduped.filter((c) => !existingEmails.has(c.email.toLowerCase()));
  const duplicatesInDb = deduped.length - toInsert.length;

  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
    const chunk = toInsert.slice(i, i + CHUNK_SIZE);
    const { error } = await service.from("outreach_targets").insert(chunk);
    if (error) {
      console.error("[outreach/import] Insert chunk failed:", error);
      return NextResponse.json(
        { error: "Échec partiel de l'import.", inserted, invalid, duplicatesInFile, duplicatesInDb },
        { status: 500 },
      );
    }
    inserted += chunk.length;
  }

  return NextResponse.json({
    total: parsed.data.contacts.length,
    inserted,
    invalid,
    duplicatesInFile,
    duplicatesInDb,
  });
}
