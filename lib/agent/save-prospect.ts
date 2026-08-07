import { createServiceClient } from "@/lib/supabase/server";
import type { ProspectData, AgentMessage } from "./types";
import { notifyHotProspect } from "./notifications";

/**
 * Enregistre un prospect en base de données Supabase.
 * Appelée depuis /api/agent/chat côté serveur.
 *
 * Utilise le service client (pas de session user nécessaire —
 * c'est le widget public qui déclenche cette sauvegarde).
 */
export async function saveProspect(params: {
  data: ProspectData;
  agentId?: string;
  companyId?: string;
  conversation?: AgentMessage[];
  conversationLength?: number;
}): Promise<{ id: string }> {
  const supabase = createServiceClient();

  // 1. Créer la conversation
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      company_id: params.companyId,
      agent_id: params.agentId,
      status: "completed",
      messages: (params.conversation ?? []).map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date().toISOString(),
      })),
      ended_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (convError) {
    console.error("[save-prospect] Conversation insert failed:", convError);
  }

  // 2. Créer le prospect
  const { data: prospect, error: prospectError } = await supabase
    .from("prospects")
    .insert({
      company_id: params.companyId,
      agent_id: params.agentId,
      conversation_id: conversation?.id ?? null,
      qualification: params.data.qualification,
      data: params.data,
      summary: params.data.resume,
      notes: params.data.notes_commerciales,
    })
    .select("id")
    .single();

  if (prospectError) {
    console.error("[save-prospect] Prospect insert failed:", prospectError);
    throw new Error("Échec de la sauvegarde du prospect");
  }

  // 3. Lier la conversation au prospect
  if (conversation?.id) {
    await supabase
      .from("conversations")
      .update({ prospect_id: prospect.id })
      .eq("id", conversation.id);
  }

  // 4. Notification email si HOT
  if (params.data.qualification === "HOT") {
    // Récupérer l'email de notification depuis les settings de la company
    let notificationEmail: string | null = null;

    if (params.companyId) {
      const { data: settings } = await supabase
        .from("company_settings")
        .select("notification_email")
        .eq("company_id", params.companyId)
        .single();

      notificationEmail = settings?.notification_email ?? null;
    }

    const sent = await notifyHotProspect(params.data, prospect.id, notificationEmail);

    if (sent) {
      await supabase
        .from("prospects")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", prospect.id);
    }
  }

  return { id: prospect.id };
}
