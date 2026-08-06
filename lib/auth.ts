import { cookies } from "next/headers";

/**
 * Auth MVP — session basée sur SESSION_SECRET.
 * Évaluation lazy pour éviter le crash au démarrage si l'env n'est pas encore chargée.
 */

const COOKIE_NAME = "velin_session";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "[auth] SESSION_SECRET non défini. Générer avec : openssl rand -hex 32",
    );
  }
  return secret;
}

/** Vérifie si l'utilisateur est authentifié. */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = getSessionSecret();
    const cookieStore = await cookies();
    const session = cookieStore.get(COOKIE_NAME);
    return session?.value === token;
  } catch {
    return false;
  }
}

/** Retourne le token de session pour le cookie. */
export function getSessionToken(): string {
  return getSessionSecret();
}
