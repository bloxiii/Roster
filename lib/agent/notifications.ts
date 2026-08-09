import { Resend } from "resend";
import type { ProspectData } from "./types";
import { sendWhatsAppMessage } from "@/lib/integrations/whatsapp";
import { syncProspectToNotion } from "@/lib/integrations/notion";

const SENDER = process.env.CONTACT_EMAIL_FROM ?? "Velin <onboarding@resend.dev>";

/** Paramètres de notification d'une entreprise (sous-ensemble de company_settings). */
export type NotificationSettings = {
  notification_email: string | null;
  notification_whatsapp: string | null;
  notion_token: string | null;
  notion_database_id: string | null;
};

/**
 * Envoie une notification email pour un prospect qualifié (HOT ou WARM).
 * L'email destinataire vient des settings de la company (multi-tenant)
 * ou de la variable d'env en fallback.
 */
async function sendEmailNotification(
  data: ProspectData,
  recipientOverride: string | null,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = recipientOverride ?? process.env.CONTACT_EMAIL_TO;

  if (!apiKey || !recipient) {
    console.warn("[notify] Clé ou destinataire absent — email non envoyé.");
    return false;
  }

  const resend = new Resend(apiKey);

  const fields = [
    ["Prénom", data.prenom],
    ["Projet", data.type_projet],
    ["Type de bien", data.type_bien],
    ["Localisation", data.localisation],
    ["Surface", data.surface_m2 ? `${data.surface_m2} m²` : null],
    ["Pièces", data.nombre_pieces],
    ["Budget", data.budget],
    ["Délai", data.delai],
    ["Email", data.contact_email],
    ["Téléphone", data.contact_telephone],
  ]
    .filter(([, v]) => v)
    .map(([label, value]) => `${label} : ${value}`)
    .join("\n");

  const text = [
    `${data.qualification === "HOT" ? "🔥" : "🌤️"} NOUVEAU PROSPECT ${data.qualification}`,
    "",
    fields,
    "",
    "— Résumé —",
    data.resume,
    "",
    "— Notes commerciales —",
    data.notes_commerciales,
  ].join("\n");

  try {
    const { error } = await resend.emails.send({
      from: SENDER,
      to: recipient,
      replyTo: data.contact_email ?? undefined,
      subject: `${data.qualification === "HOT" ? "🔥" : "🌤️"} Prospect ${data.qualification} — ${data.prenom ?? "Nouveau prospect"} — ${data.localisation ?? ""}`,
      text,
    });

    if (error) {
      console.error("[notify] Échec email:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[notify] Erreur email:", err);
    return false;
  }
}

/** Message WhatsApp condensé (les messages WhatsApp doivent rester courts). */
function buildWhatsAppText(data: ProspectData): string {
  const emoji = data.qualification === "HOT" ? "🔥" : "🌤️";
  const lines = [
    `${emoji} Prospect ${data.qualification} — ${data.prenom ?? "Nouveau contact"}`,
    data.type_projet && data.type_bien ? `${data.type_projet} · ${data.type_bien}` : null,
    data.localisation ? `📍 ${data.localisation}` : null,
    data.budget ? `💰 ${data.budget}` : null,
    data.contact_telephone ? `📞 ${data.contact_telephone}` : null,
    data.contact_email ? `✉️ ${data.contact_email}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

/**
 * Notifie une entreprise de l'arrivée d'un nouveau prospect qualifié
 * (HOT ou WARM) sur tous les canaux qu'elle a configurés.
 *
 * Chaque canal échoue indépendamment des autres (Promise.allSettled) :
 * un WhatsApp mal configuré ne doit pas empêcher l'email de partir.
 * Retourne true si AU MOINS un canal a réussi (utilisé pour horodater
 * prospects.notified_at).
 */
export async function dispatchProspectNotifications(
  data: ProspectData,
  settings: NotificationSettings | null,
): Promise<boolean> {
  const tasks: Promise<boolean>[] = [
    sendEmailNotification(data, settings?.notification_email ?? null),
  ];

  if (settings?.notification_whatsapp) {
    tasks.push(sendWhatsAppMessage(settings.notification_whatsapp, buildWhatsAppText(data)));
  }

  if (settings?.notion_token && settings?.notion_database_id) {
    tasks.push(syncProspectToNotion(data, settings.notion_token, settings.notion_database_id));
  }

  const results = await Promise.allSettled(tasks);
  return results.some((r) => r.status === "fulfilled" && r.value === true);
}
