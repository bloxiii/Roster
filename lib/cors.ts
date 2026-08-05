import { NextResponse } from "next/server";

/**
 * Headers CORS pour les routes API appelées par le widget externe.
 *
 * En production, remplacer "*" par une liste blanche de domaines clients
 * enregistrés (ex: ["https://agence-dupont.fr", "https://immo-lyon.com"]).
 * Pour le MVP / démo, on autorise tout.
 */
const ALLOWED_ORIGIN = "*";

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

/** Réponse OPTIONS pré-flight standard. */
export function handlePreflight() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

/** Ajoute les headers CORS à une NextResponse existante. */
export function withCors(response: NextResponse) {
  const headers = corsHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}
