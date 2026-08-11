import { Resend } from "resend";

export type OutreachTarget = {
  agency_name: string;
  contact_name: string | null;
  email: string;
  website: string | null;
};

export type OutreachTemplate = {
  subject: string;
  body: string;
};

/** Template par défaut, utilisé uniquement si la table outreach_email_template est vide (fallback défensif). */
export const DEFAULT_OUTREACH_TEMPLATE: OutreachTemplate = {
  subject: "Qualifiez vos prospects immobiliers automatiquement — {{agence}}",
  body: [
    "Bonjour {{contact}},",
    "",
    "Je me permets de vous contacter au sujet de {{agence}}.",
    "",
    "J'ai vu {{site}} — beau catalogue de biens.",
    "",
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
  ].join("\n"),
};

/** Balises disponibles dans le template, affichées comme légende côté UI. */
export const OUTREACH_TEMPLATE_TAGS = ["{{contact}}", "{{agence}}", "{{site}}"] as const;

/** Remplace les balises {{contact}}, {{agence}}, {{site}} par les valeurs de la cible. */
export function substituteTemplate(template: OutreachTemplate, target: OutreachTarget) {
  const replace = (text: string) =>
    text
      .replaceAll("{{contact}}", target.contact_name ?? "")
      .replaceAll("{{agence}}", target.agency_name)
      .replaceAll("{{site}}", target.website ?? "");

  return { subject: replace(template.subject), text: replace(template.body) };
}

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

/**
 * Envoie un email de prospection à une cible outreach, en substituant les
 * balises du template fourni. Retourne { delivered: false, error } plutôt
 * que de lever, pour que l'appelant puisse journaliser l'échec sur la ligne
 * concernée sans interrompre un envoi en lot.
 */
export async function sendOutreachEmail(
  target: OutreachTarget,
  template: OutreachTemplate = DEFAULT_OUTREACH_TEMPLATE,
): Promise<{ delivered: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { delivered: false, error: "RESEND_API_KEY absente." };
  }

  const resend = new Resend(apiKey);
  const { subject, text } = substituteTemplate(template, target);

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
