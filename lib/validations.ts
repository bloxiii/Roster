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
