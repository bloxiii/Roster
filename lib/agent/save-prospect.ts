import { createServiceClient } from "@/lib/supabase/server";
import type { ProspectData } from "./types";
import { dispatchProspectNotifications } from "./notifications";

/** Niveaux de qualification qui déclenchent une notification (email/WhatsApp/Notion). */
const NOTIFY_QUALIFICATIONS = ["HOT", "WARM"];

/**
 * Enregistre un prospect en base de données Supabase.
 * Appelée depuis /api/agent/chat côté serveur.
 *
 * Utilise le service client (pas de session user nécessaire —
 * c'est le widget public qui déclenche cette sauvegarde).
 *
 * La conversation elle-même n'est plus créée ici : elle est déjà persistée
 * (à chaque tour, qualifiée ou non) par upsertConversation() dans
 * lib/agent/save-conversation.ts, appelé avant ceci depuis /api/agent/chat.
 * On se contente donc de créer le prospect et de le lier à la conversation
 * existante via conversationId.
 */
export async function saveProspect(params: {
  data: ProspectData;
  agentId?: string;
  companyId?: string;
  conversationId?: string;
}): Promise<{ id: string }> {
  const supabase = createServiceClient();

  // 1. Créer le prospect
  const { data: prospect, error: prospectError } = await supabase
    .from("prospects")
    .insert({
      company_id: params.companyId,
      agent_id: params.agentId,
      conversation_id: params.conversationId ?? null,
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

  // 2. Lier la conversation existante au prospect
  if (params.conversationId) {
    await supabase
      .from("conversations")
      .update({ prospect_id: prospect.id })
      .eq("id", params.conversationId);
  }

  // 4. Notifications multi-canal (email + WhatsApp + Notion) si HOT ou WARM
  if (NOTIFY_QUALIFICATIONS.includes(params.data.qualification)) {
    let notificationSettings = null;

    if (params.companyId) {
      const { data: settings } = await supabase
        .from("company_settings")
        .select("notification_email, notification_whatsapp, notion_token, notion_database_id")
        .eq("company_id", params.companyId)
        .single();

      notificationSettings = settings;
    }

    const sent = await dispatchProspectNotifications(params.data, notificationSettings);

    if (sent) {
      await supabase
        .from("prospects")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", prospect.id);
    }
  }

  return { id: prospect.id };
}
