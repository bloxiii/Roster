import { Resend } from "resend";
import type { ContactFormInput } from "./validations";

const CONTACT_RECIPIENT = process.env.CONTACT_EMAIL_TO ?? "contact@example.com";
const SENDER = process.env.CONTACT_EMAIL_FROM ?? "Velin <onboarding@resend.dev>";

/**
 * Envoie la notification de contact.
 *
 * En l'absence de RESEND_API_KEY (ex: environnement de démo/preview sans
 * clé configurée), on journalise la demande côté serveur au lieu d'échouer,
 * pour ne jamais bloquer un prospect derrière une erreur de configuration.
 * En production, définir RESEND_API_KEY pour un envoi réel.
 */
export async function sendContactNotification(data: ContactFormInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      "[contact] RESEND_API_KEY absente — demande journalisée sans envoi d'email.",
      { name: data.name, email: data.email, company: data.company },
    );
    return { delivered: false as const };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: SENDER,
    to: CONTACT_RECIPIENT,
    replyTo: data.email,
    subject: `Nouvelle demande — ${data.company}`,
    text: [
      `Nom : ${data.name}`,
      `Email : ${data.email}`,
      `Entreprise : ${data.company}`,
      "",
      "Message :",
      data.message,
    ].join("\n"),
  });

  if (error) {
    throw new Error(`Échec de l'envoi de l'email : ${error.message}`);
  }

  return { delivered: true as const };
}
