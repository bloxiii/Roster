import { NextRequest, NextResponse } from "next/server";
import { SESSION_TOKEN } from "@/lib/auth";
import { rateLimiters } from "@/lib/rate-limit";

/**
 * Auth MVP : un mot de passe unique configuré par variable d'environnement.
 * Le cookie contient SESSION_SECRET — plus de hash devinable.
 */

const COOKIE_NAME = "roster_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

export async function POST(request: NextRequest) {
  const dashboardPassword = process.env.DASHBOARD_PASSWORD;
  if (!dashboardPassword) {
    return NextResponse.json(
      { error: "Authentification non configurée." },
      { status: 503 },
    );
  }

  // [IMPORTANT-1] Rate limiting — 5 tentatives / 15 min par IP
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (rateLimiters.auth(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans 15 minutes." },
      { status: 429 },
    );
  }

  let body: { password: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  if (body.password !== dashboardPassword) {
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
