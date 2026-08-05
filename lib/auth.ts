import { cookies } from "next/headers";

/**
 * Auth MVP — session basée sur un secret aléatoire en variable d'environnement.
 *
 * Le SESSION_SECRET est une string aléatoire de 64+ caractères,
 * générée avec : openssl rand -hex 32
 * Il sert directement de valeur attendue du cookie de session.
 *
 * C'est l'alternative simple recommandée par le QA : même niveau de sécurité
 * pour un utilisateur unique, sans le hash djb2 devinable.
 */

const COOKIE_NAME = "roster_session";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.warn(
      "[auth] SESSION_SECRET non défini — utilisation d'un fallback. " +
      "En production, définir SESSION_SECRET avec : openssl rand -hex 32",
    );
    return "__roster_dev_session_not_for_production__";
  }
  return secret;
}

export const SESSION_TOKEN = getSessionSecret();

/**
 * Vérifie si l'utilisateur est authentifié pour accéder au dashboard.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return session?.value === SESSION_TOKEN;
}
