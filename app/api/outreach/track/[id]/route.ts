import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GIF transparent 1×1, en dur (43 octets) — évite de dépendre d'un asset statique.
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7", "base64");

const PIXEL_HEADERS = {
  "Content-Type": "image/gif",
  "Content-Length": String(PIXEL.length),
  // Chaque chargement doit remonter au serveur — un cache intermédiaire
  // masquerait les ouvertures suivantes du même destinataire.
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * GET /api/outreach/track/[id] — pixel de suivi d'ouverture des emails
 * d'outreach, référencé en <img> dans le HTML envoyé (voir
 * lib/outreach/email.ts). Route volontairement PUBLIQUE et non
 * authentifiée : c'est le client mail du destinataire (ou le proxy
 * d'images de son webmail, ex: Gmail) qui la charge, jamais un utilisateur
 * connecté à l'app.
 *
 * Ne doit JAMAIS échouer visiblement : le pixel est renvoyé dans tous les
 * cas (id invalide, cible introuvable, erreur DB), pour ne jamais casser
 * l'affichage de l'email chez le destinataire. Les échecs d'enregistrement
 * sont journalisés côté serveur, silencieusement.
 *
 * Signal indicatif, pas garanti : certains clients mail bloquent le
 * chargement des images par défaut, et un même destinataire peut déclencher
 * plusieurs chargements pour une seule ouverture réelle (proxy webmail).
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Validation grossière d'UUID avant de toucher la DB — sans faire
  // dépendre la réponse (toujours le pixel) de cette validation. Journalisée
  // (au lieu d'être ignorée en silence) pour pouvoir diagnostiquer un lien
  // altéré par un client mail/webmail.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    recordOpen(id).catch((err) => {
      console.error("[outreach/track] Échec de l'enregistrement d'ouverture:", err);
    });
  } else {
    console.warn("[outreach/track] Id ignoré (format inattendu):", JSON.stringify(id));
  }

  return new NextResponse(PIXEL, { headers: PIXEL_HEADERS });
}

async function recordOpen(id: string) {
  const service = createServiceClient();

  // Les erreurs Supabase (id malformé rejeté par Postgres, RLS, cible
  // absente...) étaient auparavant ignorées silencieusement (seul `data`
  // était déstructuré) — l'échec d'enregistrement d'ouverture n'apparaissait
  // donc JAMAIS dans les logs. On capture et remonte `error` explicitement.
  const { data: target, error: selectError } = await service
    .from("outreach_targets")
    .select("opened_at, open_count")
    .eq("id", id)
    .single();

  if (selectError) {
    throw new Error(`lecture de la cible échouée: ${selectError.message}`);
  }
  if (!target) return;

  const { error: updateError } = await service
    .from("outreach_targets")
    .update({
      opened_at: target.opened_at ?? new Date().toISOString(),
      open_count: (target.open_count ?? 0) + 1,
    })
    .eq("id", id);

  if (updateError) {
    throw new Error(`mise à jour de la cible échouée: ${updateError.message}`);
  }
}
