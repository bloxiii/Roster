import { cookies } from "next/headers";

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD ?? "roster-demo-2026";
const COOKIE_NAME = "roster_session";

function makeSessionToken(password: string): string {
  let hash = 0;
  const str = `roster:${password}:${DASHBOARD_PASSWORD}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `rs_${Math.abs(hash).toString(36)}`;
}

const VALID_TOKEN = makeSessionToken(DASHBOARD_PASSWORD);

/**
 * Vérifie si l'utilisateur est authentifié pour accéder au dashboard.
 * Retourne true si le cookie de session est valide.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return session?.value === VALID_TOKEN;
}
