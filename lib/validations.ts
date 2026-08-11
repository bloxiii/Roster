import { z } from "zod";

/**
 * Schéma de validation du formulaire de contact.
 * Utilisé à la fois côté client (feedback immédiat) et côté serveur
 * (source de vérité — ne jamais faire confiance au seul client).
 */
export const contactFormSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  company: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(2000),
  // Champ honeypot anti-spam : doit rester vide, invisible pour un humain.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

/**
 * Schéma de validation des requêtes envoyées à /api/agent/chat.
 * Empêche les roles arbitraires, les messages géants (coûts tokens),
 * et les conversations anormalement longues.
 */
export const chatRequestSchema = z.object({
  // .nullable() en plus de .optional() : certains clients (widget embarqué)
  // peuvent envoyer explicitement `null` avant la 1re réponse serveur.
  conversationId: z.string().max(100).nullable().optional(),
  widgetKey: z.string().max(100).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(50),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

/**
 * Schéma de validation pour l'ajout d'une cible de prospection (outreach).
 * Utilisé par POST /api/outreach/targets — route admin-gated.
 */
export const outreachTargetSchema = z.object({
  agency_name: z.string().trim().min(2).max(150),
  contact_name: z.string().trim().max(150).optional().or(z.literal("")),
  email: z.string().trim().email().max(200),
  website: z.string().trim().max(300).optional().or(z.literal("")),
});

export type OutreachTargetInput = z.infer<typeof outreachTargetSchema>;

/**
 * Schéma de validation pour l'envoi d'un email de prospection.
 * Utilisé par POST /api/outreach/send — route admin-gated.
 */
export const outreachSendSchema = z.object({
  targetId: z.string().uuid(),
});

export type OutreachSendInput = z.infer<typeof outreachSendSchema>;

/**
 * Schéma de validation pour la mise à jour d'une cible (statut manuel,
 * ex: "marquer comme répondu"). Utilisé par PATCH /api/outreach/targets/[id].
 */
export const outreachUpdateSchema = z.object({
  status: z.enum(["pending", "sent", "failed", "replied"]),
});

export type OutreachUpdateInput = z.infer<typeof outreachUpdateSchema>;

/**
 * Schéma de validation pour l'édition du template email d'outreach.
 * Utilisé par PUT /api/outreach/template.
 */
export const outreachTemplateSchema = z.object({
  subject: z.string().trim().min(3).max(300),
  body: z.string().trim().min(10).max(5000),
});

export type OutreachTemplateInput = z.infer<typeof outreachTemplateSchema>;

/**
 * Schéma d'une ligne de contact pour l'import CSV en masse (outreach).
 * city/postal_code/phone/address sont optionnels — colonnes additionnelles
 * du CSV, absentes du formulaire d'ajout manuel.
 */
export const outreachImportRowSchema = z.object({
  agency_name: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(200),
  city: z.string().trim().max(150).optional().or(z.literal("")),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
});

export type OutreachImportRow = z.infer<typeof outreachImportRowSchema>;

/**
 * Enveloppe de la requête POST /api/outreach/import. Chaque ligne est
 * revalidée individuellement côté serveur avec outreachImportRowSchema
 * (voir la route) afin qu'une ligne invalide n'annule pas tout l'import.
 */
export const outreachImportSchema = z.object({
  contacts: z.array(z.record(z.string(), z.unknown())).min(1).max(2000),
});

export type OutreachImportInput = z.infer<typeof outreachImportSchema>;
