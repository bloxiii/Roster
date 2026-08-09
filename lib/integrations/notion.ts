import type { ProspectData } from "@/lib/agent/types";

/**
 * Synchronisation d'un prospect vers une base Notion.
 *
 * Contrairement à l'email/WhatsApp (un seul émetteur Velinova), Notion exige
 * les identifiants DE L'ENTREPRISE elle-même : Velinova ne peut pas écrire
 * dans un espace Notion privé sans que l'entreprise crée sa propre
 * intégration Notion et partage sa base avec elle. Le token et l'ID de
 * base viennent donc de company_settings (par tenant), pas de l'env.
 *
 * La base Notion cible doit avoir ces propriétés exactes (voir guide de
 * configuration) :
 *   - "Nom"          → title (colonne titre, quel que soit son nom d'origine
 *                       il faut la renommer "Nom")
 *   - "Qualification" → select (options : HOT, WARM, COLD)
 *   - "Email"         → email
 *   - "Téléphone"     → phone_number
 *   - "Budget"        → rich_text
 *   - "Localisation"  → rich_text
 *   - "Résumé"        → rich_text
 */
export async function syncProspectToNotion(
  data: ProspectData,
  token: string,
  databaseId: string,
): Promise<boolean> {
  if (!token || !databaseId) {
    console.warn("[notion] Token ou database_id manquant — synchronisation ignorée.");
    return false;
  }

  const properties: Record<string, unknown> = {
    Nom: {
      title: [{ text: { content: data.prenom ?? "Prospect sans nom" } }],
    },
    Qualification: {
      select: { name: data.qualification },
    },
  };

  if (data.contact_email) {
    properties.Email = { email: data.contact_email };
  }
  if (data.contact_telephone) {
    properties["Téléphone"] = { phone_number: data.contact_telephone };
  }
  if (data.budget) {
    properties.Budget = { rich_text: [{ text: { content: data.budget } }] };
  }
  if (data.localisation) {
    properties.Localisation = { rich_text: [{ text: { content: data.localisation } }] };
  }
  if (data.resume) {
    properties["Résumé"] = { rich_text: [{ text: { content: data.resume.slice(0, 2000) } }] };
  }

  try {
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[notion] Échec de synchronisation:", response.status, errorBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[notion] Erreur:", err);
    return false;
  }
}
