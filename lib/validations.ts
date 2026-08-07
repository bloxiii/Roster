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
  conversationId: z.string().max(100).optional(),
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
