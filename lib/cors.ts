import { NextRequest, NextResponse } from "next/server";

/**
 * CORS dynamique — contrôle quels domaines peuvent appeler les API.
 *
 * ALLOWED_ORIGINS est configuré via la variable d'env CORS_ALLOWED_ORIGINS.
 * Format : liste de domaines séparés par des virgules.
 * Exemple : "https://agence-dupont.fr,https://immo-lyon.com"
 *
 * Si non défini, autorise toute origine (mode démo/dev).
 * En production, TOUJOURS définir cette variable.
 */

function getAllowedOrigins(): string[] | null {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw) return null; // mode ouvert (dev/démo)
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function resolveOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin") ?? "";
  const allowed = getAllowedOrigins();

  if (!allowed) return "*"; // mode dev
  if (allowed.includes(origin)) return origin;
  return ""; // bloqué
}

export function corsHeaders(request: NextRequest) {
  return {
    "Access-Control-Allow-Origin": resolveOrigin(request),
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function handlePreflight(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export function withCors(response: NextResponse, request: NextRequest) {
  const headers = corsHeaders(request);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}
