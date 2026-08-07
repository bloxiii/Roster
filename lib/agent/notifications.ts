import { Resend } from "resend";
import type { ProspectData } from "./types";

const SENDER = process.env.CONTACT_EMAIL_FROM ?? "Velin <onboarding@resend.dev>";

/**
 * Envoie une notification email quand un prospect est qualifié HOT.
 * L'email destinataire vient des settings de la company (multi-tenant)
 * ou de la variable d'env en fallback.
 */
export async function notifyHotProspect(
  data: ProspectData,
  prospectId: string,
  recipientOverride?: string | null,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = recipientOverride ?? process.env.CONTACT_EMAIL_TO;

  if (!apiKey || !recipient) {
    console.warn("[notify] Clé ou destinataire absent — notification non envoyée.");
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
    "🔥 NOUVEAU PROSPECT HOT",
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
      subject: `🔥 Prospect HOT — ${data.prenom ?? "Nouveau prospect"} — ${data.localisation ?? ""}`,
      text,
    });

    if (error) {
      console.error("[notify] Échec:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[notify] Erreur:", err);
    return false;
  }
}
