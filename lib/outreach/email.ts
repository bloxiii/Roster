import { Resend } from "resend";

export type OutreachTarget = {
  id: string;
  agency_name: string;
  contact_name: string | null;
  email: string;
  website: string | null;
};

export type OutreachTemplate = {
  subject: string;
  body: string;
};

/**
 * Template par défaut, utilisé uniquement si la table outreach_email_template
 * est vide (fallback défensif).
 *
 * Ne s'appuie QUE sur {{agence}} (toujours renseignée) dans le corps du
 * texte : {{contact}} et {{site}} restent disponibles comme balises (cf.
 * OUTREACH_TEMPLATE_TAGS) pour les cibles créées manuellement, mais les
 * cibles importées en masse (voir lib/outreach/csv.ts) n'ont ni nom de
 * contact ni site — les utiliser ici produisait "Bonjour ," et "J'ai vu —
 * beau catalogue de biens.", un tell visible de mailing automatisé qui a
 * probablement contribué au 0 réponse sur 140 envois (voir discussion
 * délivrabilité du 18/08/2026).
 */
export const DEFAULT_OUTREACH_TEMPLATE: OutreachTemplate = {
  subject: "Qualifiez vos prospects immobiliers automatiquement — {{agence}}",
  body: [
    "Bonjour,",
    "",
    "Je me permets de vous contacter au sujet de {{agence}}.",
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

/**
 * Nettoie les artefacts laissés par une balise remplacée par une chaîne
 * vide (ex: "Bonjour {{contact}}," -> "Bonjour ," sur une cible sans nom de
 * contact) : espace avant une ponctuation, espaces multiples, espace en fin
 * de ligne. Filet de sécurité pour les templates personnalisés en base
 * (édités via /outreach) qui utiliseraient {{contact}}/{{site}} sans que la
 * cible ait ces informations — ça ne rend pas la phrase plus intelligente,
 * mais ça évite au moins la ponctuation orpheline qui trahit un envoi
 * automatisé.
 */
function cleanupBlanks(text: string) {
  return text
    .replace(/ +([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+$/gm, "");
}

/** Remplace les balises {{contact}}, {{agence}}, {{site}} par les valeurs de la cible. */
export function substituteTemplate(template: OutreachTemplate, target: OutreachTarget) {
  const replace = (text: string) =>
    cleanupBlanks(
      text
        .replaceAll("{{contact}}", target.contact_name ?? "")
        .replaceAll("{{agence}}", target.agency_name)
        .replaceAll("{{site}}", target.website ?? ""),
    );

  return { subject: replace(template.subject), text: replace(template.body) };
}

/**
 * Contrairement à lib/email.ts (notifications transactionnelles, qui peut
 * rester sur le domaine sandbox Resend par défaut), l'outreach DOIT partir
 * d'un domaine vérifié dans Resend (SPF/DKIM) sous peine d'échec d'envoi ou
 * de filtrage spam côté destinataire — voir https://resend.com/domains.
 *
 * Domaine configurable via OUTREACH_EMAIL_FROM (ex: un domaine dédié à la
 * prospection, distinct du domaine produit, pour isoler la réputation
 * d'envoi — voir la discussion delivrabilité en date du 17/08/2026).
 * REPLY_TO peut rester sur une autre adresse : c'est juste la boîte
 * effectivement relevée qui doit recevoir les réponses, peu importe le
 * domaine d'envoi.
 *
 * Exportées (plutôt que privées au module) pour que l'UI admin
 * (app/[locale]/outreach/page.tsx) affiche l'expéditeur réel au lieu d'une
 * valeur possiblement obsolète recopiée en dur.
 */
export const SENDER =
  process.env.OUTREACH_EMAIL_FROM ??
  process.env.CONTACT_EMAIL_FROM ??
  "Velinova <contact@velinova.xyz>";
export const REPLY_TO = process.env.OUTREACH_EMAIL_REPLY_TO ?? "contact@velinova.xyz";

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Convertit le texte brut du template en HTML minimal (paragraphes + retours à la ligne). */
function textToHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

/**
 * Construit le HTML de l'email avec le pixel de suivi d'ouverture (voir
 * GET /api/outreach/track/[id]), sans altérer le rendu visuel (1×1,
 * invisible). `baseUrl` doit être une URL absolue joignable depuis
 * Internet — sans elle, l'email part en texte seul (pas de pixel cassé).
 */
function buildTrackedHtml(text: string, targetId: string, baseUrl: string | undefined) {
  const html = textToHtml(text);
  if (!baseUrl) return html;

  const pixelUrl = `${baseUrl}/api/outreach/track/${targetId}`;
  return `${html}\n<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" />`;
}

/**
 * Envoie un email de prospection à une cible outreach, en substituant les
 * balises du template fourni. Retourne { delivered: false, error } plutôt
 * que de lever, pour que l'appelant puisse journaliser l'échec sur la ligne
 * concernée sans interrompre un envoi en lot.
 *
 * `baseUrl` (ex: "https://velinova.xyz", sans slash final) sert à
 * construire l'URL du pixel de suivi d'ouverture — voir buildTrackedHtml.
 */
export async function sendOutreachEmail(
  target: OutreachTarget,
  template: OutreachTemplate = DEFAULT_OUTREACH_TEMPLATE,
  baseUrl?: string,
): Promise<{ delivered: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { delivered: false, error: "RESEND_API_KEY absente." };
  }

  const resend = new Resend(apiKey);
  const { subject, text } = substituteTemplate(template, target);
  const html = buildTrackedHtml(text, target.id, baseUrl);

  try {
    const { error } = await resend.emails.send({
      from: SENDER,
      to: target.email,
      replyTo: REPLY_TO,
      subject,
      text,
      html,
    });

    if (error) {
      return { delivered: false, error: error.message };
    }
    return { delivered: true };
  } catch (err) {
    return { delivered: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}
