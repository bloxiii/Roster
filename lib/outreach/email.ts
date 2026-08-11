import { Resend } from "resend";

export type OutreachTarget = {
  agency_name: string;
  contact_name: string | null;
  email: string;
  website: string | null;
};

/**
 * Contrairement à lib/email.ts (notifications transactionnelles, qui peut
 * rester sur le domaine sandbox Resend par défaut), l'outreach DOIT partir
 * de contact@velinova.xyz : c'est la seule boîte que Velinova relève, donc
 * la seule adresse où une réponse de prospect a une chance d'être vue.
 *
 * ⚠️ Pour que l'envoi FONCTIONNE (et n'atterrisse pas en spam), le domaine
 * velinova.xyz doit être vérifié dans Resend (SPF/DKIM) — voir
 * https://resend.com/domains. Sans ça, Resend refusera l'envoi ou l'email
 * sera très probablement filtré côté destinataire.
 */
const SENDER =
  process.env.OUTREACH_EMAIL_FROM ??
  process.env.CONTACT_EMAIL_FROM ??
  "Velinova <contact@velinova.xyz>";
const REPLY_TO = process.env.OUTREACH_EMAIL_REPLY_TO ?? "contact@velinova.xyz";

function buildOutreachEmail(target: OutreachTarget): { subject: string; text: string } {
  const greeting = target.contact_name ? `Bonjour ${target.contact_name},` : "Bonjour,";
  const websiteLine = target.website
    ? `\nJ'ai vu ${target.website} — beau catalogue de biens.\n`
    : "\n";

  const text = [
    greeting,
    "",
    `Je me permets de vous contacter au sujet de ${target.agency_name}.`,
    websiteLine.trim(),
    "Velinova est un assistant IA qui qualifie automatiquement vos prospects",
    "immobiliers 24/7, directement depuis votre site : un visiteur discute avec",
    "l'assistant, décrit son projet, et vous recevez une fiche prospect prête à",
    "l'emploi (budget, localisation, délai, coordonnées) — sans rien changer à",
    "votre site actuel (une seule ligne de code à ajouter).",
    "",
    "Vous pouvez tester une démo en direct ici : https://velinova.xyz/demo",
    "",
    "Si ça vous intéresse, répondez simplement à cet email — je me ferai un",
    "plaisir d'en discuter avec vous.",
    "",
    "À bientôt,",
    "L'équipe Velinova",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    subject: `Qualifiez vos prospects immobiliers automatiquement — ${target.agency_name}`,
    text,
  };
}

/**
 * Envoie un email de prospection à une cible outreach.
 * Retourne { delivered: false, error } plutôt que de lever, pour que
 * l'appelant puisse journaliser l'échec sur la ligne concernée sans
 * interrompre un envoi en lot.
 */
export async function sendOutreachEmail(
  target: OutreachTarget,
): Promise<{ delivered: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { delivered: false, error: "RESEND_API_KEY absente." };
  }

  const resend = new Resend(apiKey);
  const { subject, text } = buildOutreachEmail(target);

  try {
    const { error } = await resend.emails.send({
      from: SENDER,
      to: target.email,
      replyTo: REPLY_TO,
      subject,
      text,
    });

    if (error) {
      return { delivered: false, error: error.message };
    }
    return { delivered: true };
  } catch (err) {
    return { delivered: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}
