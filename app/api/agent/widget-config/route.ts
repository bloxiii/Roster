import { NextRequest, NextResponse } from "next/server";
import { handlePreflight, withCors } from "@/lib/cors";
import { rateLimiters } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/server";

export function OPTIONS(request: NextRequest) {
  return handlePreflight(request);
}

/**
 * Couleurs par défaut — reprises du widget vanilla (public/widget/velinova-widget.js)
 * pour que l'apparence reste identique quand une entreprise n'a rien personnalisé.
 */
const DEFAULT_COLORS = {
  bg: "#1a110d",
  bot: "#2d1f17",
  user: "#7a2e26",
};

/**
 * GET /api/agent/widget-config?key=wk_xxx
 *
 * Endpoint public (appelé directement depuis le site du client, avant même
 * d'ouvrir le chat) qui résout une widget key vers les couleurs configurées
 * par l'entreprise dans son dashboard. Ne renvoie jamais de données sensibles
 * — uniquement de quoi styliser le widget.
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (rateLimiters.widgetConfig(ip)) {
    return withCors(NextResponse.json({ error: "Trop de requêtes." }, { status: 429 }), request);
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return withCors(NextResponse.json({ colors: DEFAULT_COLORS }), request);
  }

  const supabase = createServiceClient();

  const { data: wk } = await supabase
    .from("widget_keys")
    .select("company_id, is_active")
    .eq("key", key)
    .single();

  if (!wk || !wk.is_active) {
    // Clé invalide : on renvoie quand même des couleurs par défaut plutôt
    // qu'une erreur — le widget doit toujours pouvoir s'afficher.
    return withCors(NextResponse.json({ colors: DEFAULT_COLORS }), request);
  }

  const { data: settings } = await supabase
    .from("company_settings")
    .select("widget_bg_color, widget_bot_color, widget_user_color")
    .eq("company_id", wk.company_id)
    .single();

  return withCors(
    NextResponse.json({
      colors: {
        bg: settings?.widget_bg_color ?? DEFAULT_COLORS.bg,
        bot: settings?.widget_bot_color ?? DEFAULT_COLORS.bot,
        user: settings?.widget_user_color ?? DEFAULT_COLORS.user,
      },
    }),
    request,
  );
}
