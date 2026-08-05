import { NextRequest, NextResponse } from "next/server";
import { readProspects } from "@/lib/agent/save-prospect";
import { isAuthenticated } from "@/lib/auth";

/**
 * GET /api/agent/prospects — Liste des prospects (dashboard uniquement).
 *
 * Le POST a été supprimé : la sauvegarde des prospects se fait exclusivement
 * côté serveur dans /api/agent/chat via saveProspect(). Plus aucun endpoint
 * d'écriture public.
 */
export async function GET(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const qualification = searchParams.get("qualification");
  const clientId = searchParams.get("clientId") ?? "default";

  let prospects = await readProspects();
  prospects = prospects.filter((p) => p.clientId === clientId);

  if (qualification && ["HOT", "WARM", "COLD"].includes(qualification)) {
    prospects = prospects.filter((p) => p.data.qualification === qualification);
  }

  return NextResponse.json({ prospects: prospects.reverse() });
}
