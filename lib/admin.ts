/**
 * Allowlist d'accès aux outils internes Velinova (outreach, etc.).
 *
 * Volontairement DÉCONNECTÉ du système multi-tenant (companies/memberships) :
 * ces outils servent à Velinova pour prospecter des agences, pas aux clients
 * eux-mêmes. Configurer via la variable d'env OUTREACH_ADMIN_EMAILS
 * (liste d'emails séparés par des virgules). Si la variable est absente,
 * l'accès est refusé à tout le monde par défaut (deny-by-default).
 *
 * Exemple : OUTREACH_ADMIN_EMAILS="toi@exemple.com,associe@exemple.com"
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const allowlist = (process.env.OUTREACH_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(email.toLowerCase());
}
