import { NextRequest, NextResponse } from "next/server";
import type { ProspectData, AgentMessage } from "@/lib/agent/types";
import { handlePreflight, withCors } from "@/lib/cors";
import { saveProspect, readProspects } from "@/lib/agent/save-prospect";
import { isAuthenticated } from "@/lib/auth";

export function OPTIONS() {
  return handlePreflight();
}

/** POST — Enregistrer une nouvelle fiche prospect (fallback widget). */
export async function POST(request: NextRequest) {
  let body: {
    data: ProspectData;
    agentId: string;
    clientId?: string;
    conversation?: AgentMessage[];
    conversationLength: number;
  };
  try {
    body = await request.json();
  } catch {
    return withCors(NextResponse.json({ error: "Corps invalide." }, { status: 400 }));
  }

  if (!body.data || !body.data.qualification) {
    return withCors(NextResponse.json({ error: "Données prospect incomplètes." }, { status: 422 }));
  }

  const record = await saveProspect({
    data: body.data,
    agentId: body.agentId,
    clientId: body.clientId,
    conversation: body.conversation,
    conversationLength: body.conversationLength,
  });

  return withCors(NextResponse.json({ success: true, id: record.id }));
}

/** GET — Lister les fiches prospect (dashboard uniquement). */
export async function GET(request: NextRequest) {
  // [CRITIQUE-3] Vérification d'authentification
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
