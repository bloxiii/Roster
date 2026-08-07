import { type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // 1. Rafraîchir la session Supabase + protéger /dashboard
  const supabaseResponse = await updateSession(request);

  // Si Supabase a redirigé (login, etc.), on respecte la redirection
  if (supabaseResponse.headers.get("location")) {
    return supabaseResponse;
  }

  // 2. Routing i18n (locales)
  const intlResponse = intlMiddleware(request);

  // Copier les cookies Supabase dans la réponse i18n
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
