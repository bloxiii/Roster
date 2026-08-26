import { createServiceClient } from "@/lib/supabase/server";
import type { AgentMessage } from "./types";

/**
 * Enregistre (ou met à jour) une conversation en base à CHAQUE tour, que le
 * prospect ait été qualifié ou non.
 *
 * Avant ceci, une conversation n'était persistée que si l'agent parvenait
 * à extraire un bloc <prospect_data> en fin de qualification (voir
 * saveProspect) — une conversation abandonnée en cours de route (visiteur
 * qui quitte, agent qui n'obtient jamais assez d'infos, etc.) n'était donc
 * jamais écrite en base, sans aucune trace ailleurs.
 *
 * Idempotent par conversationId : chaque tour fait un upsert sur
 * conversations.id = conversationId — id fourni par le client, généré une
 * première fois côté serveur dans /api/agent/chat — donc la ligne grossit
 * progressivement au lieu d'être dupliquée à chaque message.
 */
export async function upsertConversation(params: {
  conversationId: string;
  companyId?: string;
  agentId?: string;
  messages: AgentMessage[];
  completed: boolean;
}): Promise<void> {
  // Sans company/agent (fallback legacy sans widget key — voir resolveAgent
  // dans /api/agent/chat), impossible de rattacher la conversation à un
  // tenant : les colonnes sont NOT NULL en base. On ne persiste pas plutôt
  // que de logguer une erreur d'insertion à chaque message.
  if (!params.companyId || !params.agentId) return;

  const supabase = createServiceClient();

  const payload: Record<string, unknown> = {
    id: params.conversationId,
    company_id: params.companyId,
    agent_id: params.agentId,
    status: params.completed ? "completed" : "active",
    messages: params.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: new Date().toISOString(),
    })),
  };
  if (params.completed) {
    payload.ended_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("conversations")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("[save-conversation] Upsert failed:", error);
  }
}
