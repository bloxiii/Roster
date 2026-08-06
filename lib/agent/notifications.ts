import { Resend } from "resend";
import type { ProspectData } from "./types";

const SENDER = process.env.CONTACT_EMAIL_FROM ?? "Velin <onboarding@resend.dev>";

/**
 * Envoie une notification email quand un prospect est qualifié HOT.
 *
 * Le destinataire est l'email du client (agence) configuré par variable
 * d'environnement. En production avec multi-tenant, on ira chercher l'email
 * dans la table clients.
 */
export async function notifyHotProspect(
  data: ProspectData,
  prospectId: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.NOTIFICATION_EMAIL_TO ?? process.env.CONTACT_EMAIL_TO;

  if (!apiKey || !recipient) {
    console.warn(
      "[notify] RESEND_API_KEY ou NOTIFICATION_EMAIL_TO absente — notification non envoyée.",
      { prospectId, qualification: data.qualification },
    );
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
    "",
    `Fiche complète : /dashboard/${prospectId}`,
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
      console.error("[notify] Échec de l'envoi:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[notify] Erreur inattendue:", err);
    return false;
  }
}
