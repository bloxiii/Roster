import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rafraîchit la session Supabase Auth à chaque requête.
 * Appelé depuis le proxy (middleware) Next.js.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Rafraîchir la session (important pour les tokens expirés)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protéger les routes /dashboard — rediriger vers login si pas de session
  const isDashboard = request.nextUrl.pathname.includes("/dashboard");
  const isAuthPage =
    request.nextUrl.pathname.includes("/login") ||
    request.nextUrl.pathname.includes("/signup");

  if (isDashboard && !isAuthPage && !user) {
    const locale = request.nextUrl.pathname.startsWith("/en") ? "en" : "fr";
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si déjà connecté et sur la page login, rediriger vers dashboard
  if (isAuthPage && user) {
    const locale = request.nextUrl.pathname.startsWith("/en") ? "en" : "fr";
    const dashUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashUrl);
  }

  return supabaseResponse;
}
