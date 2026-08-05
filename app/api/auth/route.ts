import { NextRequest, NextResponse } from "next/server";

/**
 * Auth MVP : un mot de passe unique configuré par variable d'environnement.
 *
 * En production, remplacer par :
 * - NextAuth.js avec providers OAuth (Google, email magic link)
 * - Table utilisateurs en DB avec hash bcrypt
 * - Sessions JWT signées
 *
 * Pour le MVP / démo, un cookie signé avec le hash du mot de passe suffit.
 */

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD ?? "roster-demo-2026";
const COOKIE_NAME = "roster_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function makeSessionToken(password: string): string {
  // Hash simple pour le MVP — pas de crypto lourde nécessaire ici
  // car le mot de passe est vérifié côté serveur, pas côté client.
  let hash = 0;
  const str = `roster:${password}:${DASHBOARD_PASSWORD}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `rs_${Math.abs(hash).toString(36)}`;
}

export const SESSION_TOKEN = makeSessionToken(DASHBOARD_PASSWORD);

export async function POST(request: NextRequest) {
  let body: { password: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  if (body.password !== DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(COOKIE_NAME, SESSION_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}

/** DELETE — Déconnexion */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
