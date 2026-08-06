/**
 * Validation des variables d'environnement.
 * Appelé dans next.config.ts pour détecter les problèmes au build, pas en runtime.
 */

type EnvVar = {
  name: string;
  required: boolean;
  description: string;
};

const ENV_VARS: EnvVar[] = [
  { name: "ANTHROPIC_API_KEY", required: true, description: "Clé API Anthropic pour l'agent IA" },
  { name: "SESSION_SECRET", required: true, description: "Secret de session (openssl rand -hex 32)" },
  { name: "DASHBOARD_PASSWORD", required: true, description: "Mot de passe du dashboard" },
  { name: "RESEND_API_KEY", required: false, description: "Clé API Resend pour les emails" },
  { name: "CONTACT_EMAIL_TO", required: false, description: "Email destinataire du formulaire" },
  { name: "NOTIFICATION_EMAIL_TO", required: false, description: "Email destinataire des alertes HOT" },
  { name: "CORS_ALLOWED_ORIGINS", required: false, description: "Domaines autorisés pour le widget (CSV)" },
];

export function validateEnv() {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const v of ENV_VARS) {
    if (!process.env[v.name]) {
      if (v.required) {
        missing.push(`  ✗ ${v.name} — ${v.description}`);
      } else {
        warnings.push(`  ○ ${v.name} — ${v.description}`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(`\n[env] Variables optionnelles non définies :\n${warnings.join("\n")}\n`);
  }

  if (missing.length > 0) {
    console.error(`\n[env] Variables OBLIGATOIRES manquantes :\n${missing.join("\n")}\n`);
    // En dev, on avertit. En production, on bloque.
    if (process.env.NODE_ENV === "production") {
      throw new Error("[env] Variables d'environnement obligatoires manquantes. Voir ci-dessus.");
    }
  }
}
