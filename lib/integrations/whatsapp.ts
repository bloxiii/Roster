/**
 * Envoi de messages WhatsApp via l'API Twilio.
 *
 * Un seul expéditeur "plateforme" (le numéro WhatsApp Velinova, configuré via
 * les variables d'env), qui envoie vers le numéro WhatsApp que chaque
 * entreprise renseigne dans ses paramètres — même logique que l'email
 * (lib/agent/notifications.ts) : un émetteur, un destinataire par tenant.
 *
 * Utilise l'API REST Twilio directement (pas de SDK) pour rester léger —
 * un seul appel HTTP suffit ici.
 */

/**
 * Envoie un message WhatsApp texte.
 * Retourne false (sans lever d'exception) si Twilio n'est pas configuré,
 * pour ne jamais bloquer l'enregistrement du prospect derrière un canal
 * de notification optionnel — même pattern que Resend (lib/email.ts).
 */
export async function sendWhatsAppMessage(
  toNumber: string,
  text: string,
): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // ex: "whatsapp:+14155238886"

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[whatsapp] Twilio non configuré — notification non envoyée.");
    return false;
  }

  const to = toNumber.startsWith("whatsapp:") ? toNumber : `whatsapp:${toNumber}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: fromNumber, To: to, Body: text }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[whatsapp] Échec Twilio:", response.status, errorBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[whatsapp] Erreur:", err);
    return false;
  }
}
